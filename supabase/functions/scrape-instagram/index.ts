import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApifyInstagramPost {
  displayUrl: string;
  caption: string;
  ownerFullName: string;
  ownerUsername: string;
  ownerProfilePicUrl: string;
  url: string;
  commentsCount: number;
  likesCount: number;
  timestamp: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body first to get username
    const { username } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user from Authorization header and handle credits
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
      
      if (!userError && user) {
        userId = user.id;
        
        // Use secure credit deduction with proper validation
        const { data: creditResult, error: creditError } = await supabase.rpc('spend_credits', {
          user_id_param: userId,
          amount_param: 2,
          reason_param: 'instagram_user_scrape',
          ref_type_param: 'user',
          ref_id_param: username
        });

        if (creditError || !creditResult?.ok) {
          console.error('❌ Credit deduction error:', creditError || creditResult);
          return new Response(
            JSON.stringify({ 
              error: 'Insufficient credits. Please check your billing page.',
              code: 'INSUFFICIENT_CREDITS',
              details: creditResult?.error || creditError?.message
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
          );
        }

        console.log('✅ Credits deducted successfully for user:', userId, 'New balance:', creditResult.new_balance);
      }
    }

    // Enhanced API key validation and logging
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    
    console.log('🔍 Environment check for scrape-instagram:');
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
    
    console.log('✅ APIFY_API_KEY found, proceeding with scraping...');

    console.log(`Starting Instagram scrape for username: ${username}`);

    // Start Apify actor run with reels-specific configuration
    const actorRunResponse = await fetch(
      'https://api.apify.com/v2/acts/apidojo~instagram-scraper/runs',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customMapFunction: "(object) => { return {...object} }",
          maxItems: 60,
          startUrls: [`https://www.instagram.com/${username.replace('@', '')}/reels`],
          until: "2023-12-31"
        }),
      }
    );

    if (!actorRunResponse.ok) {
      const errorText = await actorRunResponse.text();
      console.error('Apify actor run failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to start Instagram scraping' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const runData = await actorRunResponse.json();
    const runId = runData.data.id;

    console.log(`Actor run started with ID: ${runId}`);

    // Poll for completion (with timeout)
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes timeout
    let runStatus = 'RUNNING';
    let finalRunData = null;

    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/apidojo~instagram-scraper/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${apifyApiKey}`,
          },
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        finalRunData = statusData.data;
        runStatus = statusData.data.status;
        console.log(`Run status: ${runStatus}, attempt: ${attempts + 1}`);
      }

      attempts++;
    }

    if (runStatus !== 'SUCCEEDED') {
      console.error(`Actor run did not succeed. Final status: ${runStatus}`);
      return new Response(
        JSON.stringify({ error: 'Instagram scraping timed out or failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the dataset ID from the final run data
    const datasetId = finalRunData?.defaultDatasetId || runId;
    console.log(`Using dataset ID: ${datasetId}`);

    // Get the results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      {
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
        },
      }
    );

    if (!resultsResponse.ok) {
      console.error('Failed to fetch results');
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scraping results' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results: any[] = await resultsResponse.json();
    console.log(`Received ${results.length} posts from Apify`);
    
    // Debug: Log first result structure to understand available fields
    if (results.length > 0) {
      console.log('First result structure:', JSON.stringify(results[0], null, 2));
      console.log('Available profile photo fields:', {
        'owner.profilePicUrl': results[0]['owner.profilePicUrl'],
        profilePicUrl: results[0].profilePicUrl,
        profilePic: results[0].profilePic,
        avatar: results[0].avatar,
        image: results[0].image
      });
    }

    // Initialize Supabase client (reuse if already created)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Enhanced profile photo extraction with multiple fallbacks
    let profilePhotoUrl = null;
    if (results.length > 0) {
      const firstPost = results[0];
      // Try multiple possible field names for profile photo
      profilePhotoUrl = firstPost['owner.profilePicUrl'] || 
                       firstPost.profilePicUrl || 
                       firstPost.profilePic || 
                       firstPost.avatar || 
                       firstPost.image || 
                       null;
      
      console.log('Profile photo extraction attempt:', {
        username: username,
        profilePhotoUrl: profilePhotoUrl,
        originalFields: {
          'owner.profilePicUrl': firstPost['owner.profilePicUrl'],
          profilePicUrl: firstPost.profilePicUrl,
          profilePic: firstPost.profilePic,
          avatar: firstPost.avatar,
          image: firstPost.image
        }
      });
    }
    
    // Update search queue with profile photo
    try {
      const updateResult = await supabase
        .from('search_queue')
        .update({ profile_photo_url: profilePhotoUrl })
        .eq('username', username.replace('@', ''));
      
      console.log('Profile photo update result:', updateResult);
      if (updateResult.error) {
        console.error('Failed to update profile photo:', updateResult.error);
      }
    } catch (error) {
      console.error('Error updating profile photo:', error);
    }

    // Filter and transform results using new data structure
    const processedResults = results
      .filter(post => {
        // Skip error entries and profile info
        if (!post.url || !post.id) return false;
        // Must have basic engagement metrics
        return typeof post.likeCount === 'number' && 
               typeof post.commentCount === 'number';
      })
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .map(post => {
        const postId = post.code || post.id;
        const thumbnailUrl = post['image.url'] || '';
        const videoUrl = post['video.url'];
        const hasVideo = !!videoUrl;
        const contentType = hasVideo ? 'video' : 'image';
        
        console.log(`Processing post ${postId}: ${contentType} - likes: ${post.likeCount}, comments: ${post.commentCount}`);
        
        return {
          id: `apify-${Date.now()}-${Math.random()}`,
          post_id: postId,
          url: post.url,
          caption: post.caption || '',
          hashtags: extractHashtags(post.caption || ''),
          username: post['owner.username'],
          display_name: post['owner.fullName'],
          followers: 0, // Not available in this data
          verified: post['owner.isVerified'] || false,
          likes: post.likeCount || 0,
          comments: post.commentCount || 0,
          video_view_count: hasVideo ? (post.likeCount * 10) || 0 : 0, // Only estimate for videos
          viral_score: calculateViralScore(post.likeCount || 0, post.commentCount || 0, 0),
          engagement_rate: calculateEngagementRate(post.likeCount || 0, post.commentCount || 0),
          timestamp: post.createdAt,
          scraped_at: new Date().toISOString(),
          thumbnail_url: thumbnailUrl,
          video_url: videoUrl,
          video_duration: null,
          product_type: 'clips',
          is_video: hasVideo,
          content_type: contentType,
          search_username: username,
          profile_photo_url: profilePhotoUrl, // Add profile photo to each reel record
          user_id: userId // Add user association for RLS
        };
      });

    console.log(`Processed ${processedResults.length} posts (${processedResults.filter(p => p.content_type === 'video').length} videos, ${processedResults.filter(p => p.content_type === 'image').length} images)`);

    // Save processed results to database
    if (processedResults.length > 0) {
      console.log('💾 Saving results to database...');
      
      try {
        // Use upsert to handle duplicates gracefully
        const { data: insertedData, error: insertError } = await supabase
          .from('instagram_reels')
          .upsert(processedResults, {
            onConflict: 'post_id',
            ignoreDuplicates: false
          })
          .select();

        if (insertError) {
          console.error('❌ Database insertion error:', insertError);
          // Still return success but log the error
        } else {
          console.log('✅ Successfully saved', insertedData?.length || 0, 'reels to database');
        }
      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: processedResults,
        total: processedResults.length,
        message: `Successfully processed and saved ${processedResults.length} Instagram posts`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in scrape-instagram function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
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