import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if APIFY_API_KEY is available
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    
    console.log('🔍 Environment check for scrape-instagram-hashtags:');
    console.log('- APIFY_API_KEY exists:', !!apifyApiKey);
    console.log('- APIFY_API_KEY length:', apifyApiKey ? apifyApiKey.length : 0);
    console.log('- APIFY_API_KEY prefix:', apifyApiKey ? apifyApiKey.substring(0, 15) + '...' : 'NOT_FOUND');
    console.log('- APIFY_API_KEY trimmed length:', apifyApiKey ? apifyApiKey.trim().length : 0);
    console.log('- SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    console.log('- All API-related env keys:', Object.keys(Deno.env.toObject()).filter(key => 
      key.includes('APIFY') || key.includes('API')
    ));
    
    if (!apifyApiKey || apifyApiKey.trim() === '') {
      console.error('❌ APIFY_API_KEY not found or empty in environment variables');
      console.log('Available environment keys:', Object.keys(Deno.env.toObject()));
      
      return new Response(JSON.stringify({
        code: 'MISSING_API_KEY',
        error: 'Apify API key not configured or empty. Please contact support.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { hashtag, limit = 80 } = await req.json();
    
    if (!hashtag) {
      return new Response(JSON.stringify({ error: 'Hashtag is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct credits first
    const creditCost = 5;
    const { data: creditResult, error: creditError } = await supabase.rpc('spend_credits', {
      user_id_param: user.id,
      amount_param: creditCost,
      reason_param: 'instagram_hashtag_scraping',
      ref_type_param: 'hashtag',
      ref_id_param: hashtag
    });

    if (creditError) {
      console.error('Credit deduction error:', creditError);
      return new Response(JSON.stringify({
        code: 'CREDIT_ERROR',
        error: 'Failed to process credits'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!creditResult?.ok) {
      return new Response(JSON.stringify({
        code: 'INSUFFICIENT_CREDITS',
        error: 'Insufficient credits to perform this operation',
        current_balance: creditResult?.current_balance || 0
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Credits deducted successfully. New balance: ${creditResult.new_balance}`);

    // Create search_queue entry
    const { data: searchEntry, error: searchError } = await supabase
      .from('search_queue')
      .insert({
        user_id: user.id,
        hashtag: hashtag,
        search_type: 'hashtag',
        platform: 'instagram',
        status: 'pending'
      })
      .select()
      .single();

    if (searchError || !searchEntry) {
      console.error('Failed to create search entry:', searchError);
      // Refund credits
      await supabase.rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: -creditCost,
        reason_param: 'instagram_hashtag_scraping_refund',
        ref_type_param: 'hashtag',
        ref_id_param: hashtag
      });
      
      return new Response(JSON.stringify({
        code: 'DATABASE_ERROR',
        error: 'Failed to create search record'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchId = searchEntry.id;
    const startTime = Date.now();

    try {
      // Update status to running
      await supabase
        .from('search_queue')
        .update({ status: 'running' })
        .eq('id', searchId);

      // Create the Apify run with new actor
      const apifyResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hashtags: [hashtag],
          resultsLimit: limit,
          resultsType: "stories"
        }),
      });

      if (!apifyResponse.ok) {
        console.error('Apify API error:', apifyResponse.status, apifyResponse.statusText);
        
        // Update search status to failed
        await supabase
          .from('search_queue')
          .update({ 
            status: 'failed',
            error_message: `Apify API error: ${apifyResponse.statusText}`,
            completed_at: new Date().toISOString(),
            processing_time_seconds: Math.floor((Date.now() - startTime) / 1000)
          })
          .eq('id', searchId);
        
        // Refund credits on API failure
        await supabase.rpc('spend_credits', {
          user_id_param: user.id,
          amount_param: -creditCost,
          reason_param: 'instagram_hashtag_scraping_refund',
          ref_type_param: 'hashtag',
          ref_id_param: hashtag
        });
        
        throw new Error(`Apify API error: ${apifyResponse.statusText}`);
      }

      const runData = await apifyResponse.json();
      console.log('Apify run response structure:', JSON.stringify(runData, null, 2));
      
      // Extract run ID from response
      const runId = runData.data?.id || runData.id;
      if (!runId) {
        console.error('No run ID found in response:', runData);
        throw new Error('Failed to get run ID from Apify response');
      }
      
      console.log('Apify run created:', runId);

      // Wait for the run to complete
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${apifyApiKey}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        console.log(`Run status: ${statusData.data.status}`);

        if (statusData.data.status === 'SUCCEEDED') {
          // Get the results
          const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items`, {
            headers: {
              'Authorization': `Bearer ${apifyApiKey}`,
            },
          });

          if (!resultsResponse.ok) {
            throw new Error(`Failed to fetch results: ${resultsResponse.statusText}`);
          }

          const results = await resultsResponse.json();
          console.log(`✅ Retrieved ${results.length} hashtag results`);
          
          // Log first result structure for debugging
          if (results.length > 0) {
            console.log('First result structure:', JSON.stringify(results[0], null, 2));
            console.log('Available owner fields:', Object.keys(results[0].owner || {}));
          }

          // Transform results to match expected format
          const transformedResults = results.map((item: any) => {
            console.log(`Processing post ${item.code || item.id}: ${item.isVideo ? 'video' : 'image'} - likes: ${item.likeCount}, comments: ${item.commentCount}`);
            
            return {
              post_id: item.code || item.id || `apify-${Date.now()}-${Math.random()}`,
              shortcode: item.code,
              url: item.url,
              caption: item.caption || '',
              hashtags: extractHashtags(item.caption || ''),
              username: item.owner?.username || 'unknown',
              display_name: item.owner?.fullName || item.owner?.username || 'Unknown User',
              followers: item.owner?.followerCount || 0,
              verified: item.owner?.isVerified || false,
              likes: item.likeCount || 0,
              comments: item.commentCount || 0,
              video_view_count: item.video?.playCount || item.video?.viewCount || item.playCount || 0,
              viral_score: calculateViralScore(item.likeCount || 0, item.commentCount || 0, item.video?.playCount || 0),
              engagement_rate: calculateEngagementRate(item.likeCount || 0, item.commentCount || 0),
              timestamp: item.createdAt,
              scraped_at: new Date().toISOString(),
              thumbnail_url: item.image?.url || item.displayUrl,
              video_url: item.video?.url || (item.isVideo ? item.videoUrl : null),
              video_duration: item.video?.duration || null,
              is_video: item.isVideo || !!item.video?.url,
              product_type: 'clips',
              search_hashtag: hashtag,
              search_requested_at: new Date().toISOString(),
              processing_time_seconds: Math.floor((Date.now() - startTime) / 1000),
              user_id: user.id,
              search_id: searchId
            };
          });

          console.log(`Processed ${transformedResults.length} posts (${transformedResults.filter(r => r.is_video).length} videos, ${transformedResults.filter(r => !r.is_video).length} images)`);

          // Sort results by viral metrics for better discovery (most viral first)
          transformedResults.sort((a, b) => {
            // Primary: video views (descending)
            if (b.video_view_count !== a.video_view_count) {
              return (b.video_view_count || 0) - (a.video_view_count || 0);
            }
            // Secondary: likes (descending)  
            if (b.likes !== a.likes) {
              return (b.likes || 0) - (a.likes || 0);
            }
            // Tertiary: viral score (descending)
            return (b.viral_score || 0) - (a.viral_score || 0);
          });

          console.log('📈 Results sorted by viral metrics (most viewed first)');
          console.log('💾 Saving results to database...');
          
          // Insert results into instagram_reels table
          if (transformedResults.length > 0) {
            const { error: insertError } = await supabase
              .from('instagram_reels')
              .upsert(transformedResults, { 
                onConflict: 'post_id',
                ignoreDuplicates: false 
              });

            if (insertError) {
              console.error('❌ Database insertion error:', insertError);
              // Continue execution - don't fail the entire operation for DB conflicts
            } else {
              console.log('✅ Successfully saved results to database');
            }
          }

          // Update search status to completed
          await supabase
            .from('search_queue')
            .update({ 
              status: 'completed',
              total_results: transformedResults.length,
              completed_at: new Date().toISOString(),
              processing_time_seconds: Math.floor((Date.now() - startTime) / 1000)
            })
            .eq('id', searchId);

          return new Response(JSON.stringify({ 
            success: true, 
            data: transformedResults,
            credits_used: creditCost,
            remaining_credits: creditResult.new_balance
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (statusData.data.status === 'FAILED') {
          // Update search status to failed
          await supabase
            .from('search_queue')
            .update({ 
              status: 'failed',
              error_message: 'Apify scraping job failed',
              completed_at: new Date().toISOString(),
              processing_time_seconds: Math.floor((Date.now() - startTime) / 1000)
            })
            .eq('id', searchId);

          // Refund credits on scraping failure
          await supabase.rpc('spend_credits', {
            user_id_param: user.id,
            amount_param: -creditCost,
            reason_param: 'instagram_hashtag_scraping_refund',
            ref_type_param: 'hashtag',
            ref_id_param: hashtag
          });
          
          throw new Error('Scraping job failed');
        }

        attempts++;
      }

      // Timeout - update search status and refund credits
      await supabase
        .from('search_queue')
        .update({ 
          status: 'failed',
          error_message: 'Scraping job timed out',
          completed_at: new Date().toISOString(),
          processing_time_seconds: Math.floor((Date.now() - startTime) / 1000)
        })
        .eq('id', searchId);

      await supabase.rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: -creditCost,
        reason_param: 'instagram_hashtag_scraping_refund',
        ref_type_param: 'hashtag',
        ref_id_param: hashtag
      });
      
      throw new Error('Scraping job timed out');

    } catch (scrapingError) {
      console.error('Scraping error:', scrapingError);
      
      // Update search status to failed if not already updated
      try {
        await supabase
          .from('search_queue')
          .update({ 
            status: 'failed',
            error_message: scrapingError.message || 'Failed to scrape Instagram hashtag',
            completed_at: new Date().toISOString(),
            processing_time_seconds: Math.floor((Date.now() - startTime) / 1000)
          })
          .eq('id', searchId);
      } catch (updateError) {
        console.error('Failed to update search status:', updateError);
      }
      
      return new Response(JSON.stringify({
        code: 'SCRAPING_ERROR',
        error: scrapingError.message || 'Failed to scrape Instagram hashtag'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractHashtags(caption: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  return caption.match(hashtagRegex) || [];
}

function calculateViralScore(likes: number, comments: number, views: number = 0): number {
  // Enhanced viral score calculation for reels
  const engagementScore = likes + (comments * 15) + (views * 0.1);
  return Math.min(100, Math.floor(engagementScore / 2000));
}

function calculateEngagementRate(likes: number, comments: number): number {
  // Simplified engagement rate calculation
  const totalEngagement = likes + comments;
  return Math.min(15, totalEngagement / 1000);
}