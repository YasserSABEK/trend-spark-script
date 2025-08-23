import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = new Date();

  try {
    const { hashtag, offset = 0, limit = 50 } = await req.json();

    if (!hashtag) {
      return new Response(
        JSON.stringify({ success: false, error: 'Hashtag is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    console.log(`Starting TikTok hashtag scrape for: ${hashtag} (offset: ${offset}, limit: ${limit})`);

    // Only charge credits for the first page (offset 0)
    if (offset === 0) {
      // Use new credit system for consistency with frontend
      const { data: creditResult, error: creditError } = await supabase.rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: 1,
        reason_param: 'tiktok_hashtag_search',
        ref_type_param: 'hashtag',
        ref_id_param: hashtag
      });

      if (creditError) {
        console.error('❌ Credit spending error:', creditError);
        throw new Error('Failed to process credits: ' + creditError.message);
      }

      if (!creditResult.ok) {
        console.log('❌ Insufficient credits for user:', user.id, creditResult.error || 'Insufficient credits');
        throw new Error('Insufficient credits');
      }

      console.log('✅ Credits spent successfully for user:', user.id, 'New balance:', creditResult.new_balance);
    }

    // Clean hashtag (remove # if present)
    const cleanHashtag = hashtag.replace('#', '');

    // Create or update search queue entry
    let searchEntry;
    if (offset === 0) {
      // First page - create new search entry
      const { data, error: searchError } = await supabase
        .from('search_queue')
        .insert({
          hashtag: cleanHashtag,
          search_type: 'hashtag',
          platform: 'tiktok',
          status: 'pending',
          user_id: user.id,
          username: null // Explicitly set to null for hashtag searches
        })
        .select()
        .single();
      
      searchEntry = data;
      if (searchError) {
        console.error('Error adding to search queue:', searchError);
      }
    } else {
      // Subsequent pages - find existing search entry
      const { data } = await supabase
        .from('search_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('hashtag', cleanHashtag)
        .eq('search_type', 'hashtag')
        .eq('platform', 'tiktok')
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();
      
      searchEntry = data;
    }

    // Enhanced API key validation and logging
    const apifyToken = Deno.env.get('APIFY_API_KEY');
    
    console.log('🔍 Environment check for scrape-tiktok-hashtags:');
    console.log('- APIFY_API_KEY exists:', !!apifyToken);
    console.log('- APIFY_API_KEY length:', apifyToken ? apifyToken.length : 0);
    console.log('- APIFY_API_KEY prefix:', apifyToken ? apifyToken.substring(0, 15) + '...' : 'NOT_FOUND');
    console.log('- APIFY_API_KEY trimmed length:', apifyToken ? apifyToken.trim().length : 0);
    console.log('- SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    console.log('- All API-related env keys:', Object.keys(Deno.env.toObject()).filter(key => 
      key.includes('APIFY') || key.includes('API')
    ));
    
    if (!apifyToken || apifyToken.trim() === '') {
      console.error('❌ APIFY_API_KEY not found or empty in environment variables');
      console.log('Available environment keys:', Object.keys(Deno.env.toObject()));
      
      // Update search queue with failure status  
      try {
        if (searchEntry?.id) {
          await supabase
            .from('search_queue')
            .update({ 
              status: 'failed',
              error_message: 'API key not configured or empty'
            })
            .eq('id', searchEntry.id);
        }
      } catch (error) {
        console.error('Failed to update search queue:', error);
      }
      
      throw new Error('TikTok hashtag scraping temporarily unavailable. API key not configured or empty.');
    }
    
    console.log('✅ APIFY_API_KEY found, proceeding with TikTok hashtag scraping...');

    const actorId = '5K30i8aFccKNF5ICs'; // Official apidojo/tiktok-scraper actor ID
    
    // Enhanced pagination to fetch more videos (up to 100 total)
    const maxItems = Math.min(100, offset + limit); // Fetch up to 100 videos total
    const targetLimit = Math.min(limit, 50); // Still limit per-page response
    
    const input = {
      customMapFunction: "(object) => { return {...object} }",
      includeSearchKeywords: false,
      maxItems: maxItems, // Fetch more videos to ensure good pagination
      sortType: "RELEVANCE",
      startUrls: [`https://www.tiktok.com/tag/${cleanHashtag}`],
      // Add additional parameters for better scraping reliability
      proxyConfiguration: {
        useApifyProxy: true
      }
    };

    console.log('Starting Apify run with input:', JSON.stringify(input, null, 2));

    // Start Apify run with enhanced error handling
    let startResponse;
    let retryCount = 0;
    const maxStartRetries = 3;
    
    while (retryCount < maxStartRetries) {
      try {
        startResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apifyToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });

        if (startResponse.ok) break;
        
        const errorText = await startResponse.text();
        console.error(`Apify API Error (attempt ${retryCount + 1}): ${startResponse.status} ${startResponse.statusText}`, errorText);
        
        if (retryCount === maxStartRetries - 1) {
          throw new Error(`Failed to start Apify run after ${maxStartRetries} attempts: ${startResponse.statusText} - ${errorText}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        retryCount++;
      } catch (fetchError) {
        console.error(`Network error starting Apify run (attempt ${retryCount + 1}):`, fetchError);
        if (retryCount === maxStartRetries - 1) {
          throw new Error(`Network error starting Apify run: ${fetchError}`);
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        retryCount++;
      }
    }

    const startData = await startResponse!.json();
    const runId = startData.data.id;
    console.log(`Started Apify run: ${runId}`);

    // Poll for completion with enhanced monitoring
    let attempts = 0;
    const maxAttempts = 120; // Increased to 10 minutes max for better success rate
    let runData;
    let lastStatus = 'RUNNING';

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      try {
        const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
          headers: { 'Authorization': `Bearer ${apifyToken}` },
        });

        if (!statusResponse.ok) {
          console.error(`Error checking run status: ${statusResponse.status}`);
          attempts++;
          continue;
        }

        runData = await statusResponse.json();
        const status = runData.data.status;
        
        // Only log status changes to reduce noise
        if (status !== lastStatus) {
          console.log(`Run status changed to: ${status} (after ${attempts + 1} attempts)`);
          lastStatus = status;
        }

        if (status === 'SUCCEEDED') {
          console.log('Run completed successfully');
          break;
        } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
          const errorMessage = runData.data.errorMessage || `Run failed with status: ${status}`;
          console.error(`Apify run failed:`, errorMessage);
          throw new Error(`Apify run failed: ${errorMessage}`);
        }

        attempts++;
      } catch (statusError) {
        console.error(`Error checking run status (attempt ${attempts + 1}):`, statusError);
        attempts++;
        // Continue polling unless it's the last attempt
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to check run status: ${statusError}`);
        }
      }
    }

    if (attempts >= maxAttempts) {
      console.error(`Run timed out after ${maxAttempts} attempts (${maxAttempts * 5} seconds)`);
      throw new Error(`Apify run timed out after ${Math.round(maxAttempts * 5 / 60)} minutes`);
    }

    // Get results from dataset with enhanced error handling
    const datasetId = runData.data.defaultDatasetId;
    if (!datasetId) {
      throw new Error('No dataset ID found in Apify run data');
    }
    
    console.log(`Using dataset ID: ${datasetId}`);
    
    let datasetResponse;
    let retryCount = 0;
    const maxDatasetRetries = 3;
    
    while (retryCount < maxDatasetRetries) {
      try {
        datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
          headers: { 'Authorization': `Bearer ${apifyToken}` },
        });

        if (datasetResponse.ok) break;
        
        console.error(`Dataset fetch error (attempt ${retryCount + 1}): ${datasetResponse.status}`);
        if (retryCount === maxDatasetRetries - 1) {
          throw new Error(`Failed to fetch dataset after ${maxDatasetRetries} attempts: ${datasetResponse.statusText}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        retryCount++;
      } catch (fetchError) {
        console.error(`Network error fetching dataset (attempt ${retryCount + 1}):`, fetchError);
        if (retryCount === maxDatasetRetries - 1) {
          throw new Error(`Network error fetching dataset: ${fetchError}`);
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        retryCount++;
      }
    }

    let allVideos;
    try {
      allVideos = await datasetResponse!.json();
      if (!Array.isArray(allVideos)) {
        console.error('Dataset response is not an array:', allVideos);
        allVideos = [];
      }
    } catch (parseError) {
      console.error('Error parsing dataset JSON:', parseError);
      allVideos = [];
    }
    
    console.log(`Retrieved ${allVideos.length} videos for hashtag: ${cleanHashtag}`);
    
    // Apply pagination to the results  
    const videos = allVideos.slice(offset, offset + targetLimit);
    console.log(`Paginated to ${videos.length} videos (offset: ${offset}, limit: ${targetLimit})`);
    
    // Log pagination details for debugging
    console.log(`Pagination details:
    - Total videos fetched from Apify: ${allVideos.length}
    - Requested offset: ${offset}
    - Requested limit: ${limit}
    - Target limit: ${targetLimit}
    - Videos being processed: ${videos.length}
    - Has more videos: ${allVideos.length > offset + videos.length}`);
    
    // Log sample video structure for debugging
    if (videos.length > 0) {
      console.log('Sample video structure:', JSON.stringify(videos[0], null, 2));
      
      // Log available thumbnail fields for debugging
      const firstVideo = videos[0];
      console.log('Available thumbnail fields:');
      console.log('- covers?.default:', firstVideo.covers?.default);
      console.log('- videoMeta?.coverUrl:', firstVideo.videoMeta?.coverUrl);
      console.log('- videoMeta?.originalCoverUrl:', firstVideo.videoMeta?.originalCoverUrl);
      console.log('- covers?.[0]:', firstVideo.covers?.[0]);
      console.log('- thumbnail:', firstVideo.thumbnail);
      console.log('- thumbnailUrl:', firstVideo.thumbnailUrl);
      console.log('- cover:', firstVideo.cover);
    }

    // Filter videos from the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Deduplicate videos by video.id first
    const videoMap = new Map();
    videos.forEach((video: any) => {
      if (video.id) {
        videoMap.set(video.id, video);
      }
    });
    
    const deduplicatedVideos = Array.from(videoMap.values());
    console.log(`Deduplicated ${videos.length} videos to ${deduplicatedVideos.length} unique videos`);

    // Filter videos from the last year using apidojo format
    const recentVideos = deduplicatedVideos.filter((video: any) => {
      const uploadedAt = video.uploadedAt || video.uploadedAtFormatted || null;
      if (!uploadedAt) return false;
      // Handle both timestamp (seconds) and ISO string formats
      const timestamp = typeof uploadedAt === 'number' ? uploadedAt * 1000 : uploadedAt;
      const videoDate = new Date(timestamp);
      return videoDate >= oneYearAgo;
    });

    // Process and insert videos using apidojo format
    const processedVideos = recentVideos.map((video: any, index: number) => {
      // Extract hashtags from title (apidojo format)
      const hashtags = extractHashtags(video.title || '');
      
      // Calculate viral score based on TikTok metrics
      const viralScore = calculateViralScore(
        video.likes || 0,
        video.comments || 0,
        video.views || 0,
        video.shares || 0
      );

      // Calculate engagement rate
      const engagementRate = calculateEngagementRate(
        video.likes || 0,
        video.comments || 0,
        video.shares || 0,
        video.bookmarks || 0,
        video.views || 0
      );

      // Generate unique post_id with better collision prevention
      const uniquePostId = video.id || `tiktok_${Date.now()}_${offset}_${index}_${Math.floor(Math.random() * 10000)}`;
      
      return {
        post_id: uniquePostId,
        url: video.postPage || video.url,
        web_video_url: video.postPage || video.url,
        caption: video.title || '',
        hashtags,
        username: video['channel.username'] || '',
        display_name: video['channel.name'] || null,
        author_avatar: video['channel.avatar'] || null,
        
        // TikTok engagement metrics (apidojo format)
        digg_count: video.likes || 0,
        share_count: video.shares || 0,
        play_count: video.views || 0,
        comment_count: video.comments || 0,
        collect_count: video.bookmarks || 0,
        
        // Video metadata (apidojo format)
        video_duration: video['video.duration'] || null,
        is_video: true,
        thumbnail_url: video['video.thumbnail'] || video['video.cover'] || null,
        video_url: video['video.url'] || null,
        
        // Music metadata (apidojo format)
        music_name: video['song.title'] || null,
        music_author: video['song.artist'] || null,
        music_original: video['song.artist'] === video['channel.name'],
        
        // Calculated metrics
        viral_score: viralScore,
        engagement_rate: engagementRate,
        
        // Timestamps (apidojo format)
        timestamp: video.uploadedAtFormatted || (video.uploadedAt ? new Date(video.uploadedAt * 1000).toISOString() : null),
        
        // Search metadata
        search_hashtag: cleanHashtag,
        apify_run_id: runId,
        dataset_id: datasetId,
        platform: 'tiktok',
        user_id: user.id // Add user association for RLS
      };
    });

    // Insert videos into database with improved batch processing
    if (processedVideos.length > 0) {
      console.log(`Processing ${processedVideos.length} videos for database insertion`);
      
      // Process in smaller batches to prevent timeout and conflicts
      const batchSize = 20;
      let totalInserted = 0;
      
      for (let i = 0; i < processedVideos.length; i += batchSize) {
        const batch = processedVideos.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(processedVideos.length/batchSize)} (${batch.length} videos)`);
        
        try {
          const { error: insertError } = await supabase
            .from('tiktok_videos')
            .upsert(batch, { 
              onConflict: 'user_id,post_id',
              ignoreDuplicates: true // Ignore duplicates to prevent conflicts
            });

          if (insertError) {
            console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
            // Continue with next batch instead of throwing
            continue;
          }
          
          totalInserted += batch.length;
          console.log(`✅ Successfully processed batch ${Math.floor(i/batchSize) + 1} (${batch.length} videos)`);
        } catch (batchError) {
          console.error(`Failed to process batch ${Math.floor(i/batchSize) + 1}:`, batchError);
          // Continue with next batch
          continue;
        }
      }
      
      console.log(`✅ Successfully processed ${totalInserted}/${processedVideos.length} videos total`);
    }

    // Update search queue status - Only for first page
    const endTime = new Date();
    const processingTime = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    if (searchEntry?.id && offset === 0) {
      // For first page, update with total available videos and actual processed count
      const { error: updateError } = await supabase
        .from('search_queue')
        .update({ 
          status: 'completed',
          total_results: allVideos.length, // Store total videos found by scraper
          processing_time_seconds: processingTime,
          completed_at: endTime.toISOString()
        })
        .eq('id', searchEntry.id);

      if (updateError) {
        console.error('Error updating search queue:', updateError);
      } else {
        console.log(`✅ Search queue updated: ${allVideos.length} total videos found, ${processedVideos.length} processed in this batch`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully scraped ${processedVideos.length} TikTok videos for hashtag: ${cleanHashtag}`,
        hashtag: cleanHashtag,
        videosFound: processedVideos.length,
        processingTimeSeconds: processingTime,
        offset: offset,
        limit: targetLimit,
        hasMore: allVideos.length > offset + videos.length, // Check if there are more videos available
        totalFetched: offset + processedVideos.length,
        totalAvailable: allVideos.length,
        actualVideosInBatch: videos.length, // Debug info
        processedVideosCount: processedVideos.length // Debug info
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in scrape-tiktok-hashtags function:', error);
    
    // Try to refund credits and update search queue status if operation failed
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get user and refund credits for failed operation (only for first page)
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          const requestBody = await req.json().catch(() => ({}));
          const offset = requestBody.offset || 0;
          
          // Only refund for first page failures
          if (offset === 0) {
            // Refund credit for failed operation (add 1 credit back)
            const { error: refundError } = await supabase.rpc('spend_credits', {
              user_id_param: user.id,
              amount_param: -1, // Negative amount adds credits back
              reason_param: 'refund_failed_tiktok_hashtag_search',
              ref_type_param: 'refund',
              ref_id_param: `hashtag_${Date.now()}`
            });
            
            if (refundError) {
              console.error('❌ Failed to refund credits:', refundError);
            } else {
              console.log('✅ Refunded 1 credit due to operation failure');
            }
          }
          
          // Update search queue status to failed
          await supabase
            .from('search_queue')
            .update({ 
              status: 'failed',
              error_message: error.message || 'An unexpected error occurred',
              completed_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('search_type', 'hashtag')
            .eq('status', 'pending')
            .order('requested_at', { ascending: false })
            .limit(1);
        }
      }
    } catch (updateError) {
      console.error('Error updating search queue status:', updateError);
    }
    
    // Return 200 with error object instead of 500
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'An unexpected error occurred',
      details: error.toString()
    }), {
      status: 200, // Changed from 500 to 200
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to extract hashtags from text
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#\w+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
}

// Calculate viral score for TikTok
function calculateViralScore(likes: number, comments: number, views: number, shares: number): number {
  const engagement = likes + (comments * 3) + (shares * 5);
  const viewRatio = views > 0 ? engagement / views : 0;
  return Math.round((engagement * 0.7) + (viewRatio * 10000 * 0.3));
}

// Calculate engagement rate for TikTok
function calculateEngagementRate(likes: number, comments: number, shares: number, collects: number, views: number): number {
  if (views === 0) return 0;
  const totalEngagement = likes + comments + shares + collects;
  return totalEngagement / views;
}