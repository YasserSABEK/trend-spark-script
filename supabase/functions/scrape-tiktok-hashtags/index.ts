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

  try {
    const { hashtag } = await req.json();
    
    if (!hashtag) {
      throw new Error('Hashtag is required');
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

    console.log(`Starting TikTok hashtag scrape for: ${hashtag}`);

    // Deduct credits before starting
    const { data: creditResult, error: creditError } = await supabase.rpc('deduct_credits', {
      user_id_param: user.id,
      credits_to_deduct: 2
    });

    if (creditError || !creditResult) {
      throw new Error('Insufficient credits or failed to deduct credits');
    }

    // Clean hashtag (remove # if present)
    const cleanHashtag = hashtag.replace('#', '');

    // Add to search queue
    const { data: searchEntry, error: searchError } = await supabase
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

    if (searchError) {
      console.error('Error adding to search queue:', searchError);
    }

    // Configure Apify run
    const apifyToken = Deno.env.get('APIFY_API_KEY');
    if (!apifyToken) {
      throw new Error('Apify API key not configured');
    }

    const actorId = 'clockworks/tiktok-hashtag-scraper';
    const input = {
      hashtag: cleanHashtag,
      resultsPerPage: 100,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false
    };

    console.log('Starting Apify run with input:', JSON.stringify(input, null, 2));

    // Start Apify run
    const startResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!startResponse.ok) {
      throw new Error(`Failed to start Apify run: ${startResponse.statusText}`);
    }

    const startData = await startResponse.json();
    const runId = startData.data.id;
    console.log(`Started Apify run: ${runId}`);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    let runData;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${apifyToken}` },
      });

      runData = await statusResponse.json();
      const status = runData.data.status;
      
      console.log(`Run status (attempt ${attempts + 1}): ${status}`);

      if (status === 'SUCCEEDED') {
        console.log('Run completed successfully');
        break;
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Apify run failed with status: ${status}`);
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Apify run timed out');
    }

    // Get results from dataset
    const datasetId = runData.data.defaultDatasetId;
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
      headers: { 'Authorization': `Bearer ${apifyToken}` },
    });

    const videos = await datasetResponse.json();
    console.log(`Retrieved ${videos.length} videos for hashtag: ${cleanHashtag}`);
    
    // Log sample video structure for debugging
    if (videos.length > 0) {
      console.log('Sample video structure:', JSON.stringify(videos[0], null, 2));
    }

    // Filter videos from the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentVideos = videos.filter((video: any) => {
      if (!video.createTimeISO) return false;
      const videoDate = new Date(video.createTimeISO);
      return videoDate >= oneYearAgo;
    });

    // Process and insert videos
    const processedVideos = recentVideos.map((video: any) => {
      // Extract hashtags from text
      const hashtags = extractHashtags(video.text || '');
      
      // Calculate viral score based on TikTok metrics
      const viralScore = calculateViralScore(
        video.diggCount || 0,
        video.commentCount || 0,
        video.playCount || 0,
        video.shareCount || 0
      );

      // Calculate engagement rate
      const engagementRate = calculateEngagementRate(
        video.diggCount || 0,
        video.commentCount || 0,
        video.shareCount || 0,
        video.collectCount || 0,
        video.playCount || 0
      );

      return {
        post_id: video.webVideoUrl?.split('/').pop() || `tiktok_${Date.now()}_${Math.random()}`,
        url: video.webVideoUrl,
        web_video_url: video.webVideoUrl,
        caption: video.text,
        hashtags,
        username: video.authorMeta?.name || video.author?.name,
        display_name: video.authorMeta?.nickname || video.author?.nickname,
        author_avatar: video.authorMeta?.avatar || video.author?.avatar,
        
        // TikTok engagement metrics
        digg_count: video.diggCount || 0,
        share_count: video.shareCount || 0,
        play_count: video.playCount || 0,
        comment_count: video.commentCount || 0,
        collect_count: video.collectCount || 0,
        
        // Video metadata
        video_duration: video.videoMeta?.duration || video.duration,
        is_video: true,
        thumbnail_url: video.videoMeta?.cover || video.cover,
        video_url: video.videoUrl || video.downloadUrl,
        
        // Music metadata
        music_name: video.musicMeta?.musicName || video.music?.title,
        music_author: video.musicMeta?.musicAuthor || video.music?.authorName,
        music_original: video.musicMeta?.musicOriginal || false,
        
        // Calculated metrics
        viral_score: viralScore,
        engagement_rate: engagementRate,
        
        // Timestamps
        timestamp: video.createTimeISO,
        
        // Search metadata
        search_hashtag: cleanHashtag,
        apify_run_id: runId,
        dataset_id: datasetId,
        platform: 'tiktok'
      };
    });

    // Insert videos into database
    if (processedVideos.length > 0) {
      const { error: insertError } = await supabase
        .from('tiktok_videos')
        .insert(processedVideos);

      if (insertError) {
        console.error('Error inserting videos:', insertError);
        throw new Error('Failed to save videos to database');
      }
    }

    // Update search queue status
    if (searchEntry) {
      await supabase
        .from('search_queue')
        .update({ 
          status: 'completed',
          total_results: processedVideos.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', searchEntry.id);
    }

    return new Response(JSON.stringify({
      success: true,
      videosFound: processedVideos.length,
      hashtag: cleanHashtag,
      runId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-tiktok-hashtags function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
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