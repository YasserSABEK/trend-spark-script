import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    if (!username) {
      throw new Error('Username is required');
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apifyToken = Deno.env.get('APIFY_API_KEY');
    if (!apifyToken) throw new Error('Apify API key not configured');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Authentication failed');

    // Deduct credits securely
    const { data: creditResult, error: creditError } = await supabase.rpc('safe_deduct_credits', {
      user_id_param: user.id,
      credits_to_deduct: 2,
    });
    if (creditError) throw new Error('Failed to process credits: ' + creditError.message);
    if (!creditResult.success) throw new Error(creditResult.message || 'Insufficient credits');

    const cleanUsername = username.replace(/^@/, '');
    console.log(`Starting TikTok user scrape for: ${cleanUsername}`);

    // Configure Apify run (same actor as hashtags, in user mode via profile URL)
    const actorId = 'GdWCkxBtKWOsKjdch';
    const input = {
      profiles: [`https://www.tiktok.com/@${cleanUsername}`],
      resultsPerPage: 100,
      shouldDownloadCovers: true,
      shouldDownloadSlideshowImages: false,
      shouldDownloadSubtitles: false,
      shouldDownloadVideos: false,
    } as Record<string, unknown>;

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
      const errorText = await startResponse.text();
      throw new Error(`Failed to start Apify run: ${startResponse.statusText} - ${errorText}`);
    }

    const startData = await startResponse.json();
    const runId = startData.data.id;
    console.log(`Started Apify run: ${runId}`);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60;
    let runData: any;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { Authorization: `Bearer ${apifyToken}` },
      });
      runData = await statusResponse.json();
      const status = runData.data.status;
      console.log(`Run status (attempt ${attempts + 1}): ${status}`);
      if (status === 'SUCCEEDED') break;
      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        throw new Error(`Apify run failed with status: ${status}`);
      }
      attempts++;
    }

    if (attempts >= maxAttempts) throw new Error('Apify run timed out');

    // Fetch dataset items
    const datasetId = runData.data.defaultDatasetId;
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
      headers: { Authorization: `Bearer ${apifyToken}` },
    });
    const items = await datasetResponse.json();
    console.log(`Retrieved ${items.length} items for user: ${cleanUsername}`);

    // Filter to recent videos (last 1 year) and map
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const processedVideos = (items || [])
      .filter((video: any) => {
        const iso = video.createTimeISO || video.createTime || null;
        if (!iso) return false;
        const d = new Date(iso);
        return d >= oneYearAgo;
      })
      .map((video: any) => {
        const hashtags = extractHashtags(video.text || '');
        return {
          post_id: video.webVideoUrl?.split('/').pop() || video.id || `tiktok_${Date.now()}_${Math.random()}`,
          url: video.webVideoUrl || video.url,
          web_video_url: video.webVideoUrl || video.url,
          caption: video.text || '',
          hashtags,
          username: video.authorMeta?.name || cleanUsername,
          display_name: video.authorMeta?.nickname || null,
          author_avatar: video.authorMeta?.avatar || null,

          digg_count: video.diggCount || 0,
          share_count: video.shareCount || 0,
          play_count: video.playCount || 0,
          comment_count: video.commentCount || 0,
          collect_count: video.collectCount || 0,

          video_duration: video.videoMeta?.duration || video.duration || null,
          is_video: true,
          thumbnail_url: video.covers?.default || video.videoMeta?.coverUrl || video.videoMeta?.originalCoverUrl || video.covers?.[0] || video.thumbnail || video.thumbnailUrl || video.cover || null,
          video_url: video.videoUrl || video.downloadUrl || null,

          music_name: video.musicMeta?.musicName || video.music?.title || null,
          music_author: video.musicMeta?.musicAuthor || video.music?.authorName || null,
          music_original: video.musicMeta?.musicOriginal || false,

          viral_score: calculateViralScore(
            video.diggCount || 0,
            video.commentCount || 0,
            video.playCount || 0,
            video.shareCount || 0,
          ),
          engagement_rate: calculateEngagementRate(
            video.diggCount || 0,
            video.commentCount || 0,
            video.shareCount || 0,
            video.collectCount || 0,
            video.playCount || 0,
          ),

          timestamp: video.createTimeISO || null,
          platform: 'tiktok',
          user_id: user.id,
          search_username: cleanUsername,
          apify_run_id: runId,
          dataset_id: datasetId,
        };
      });

    // Return processed videos directly instead of saving to database
    console.log(`Processed ${processedVideos.length} videos for immediate display`);
    // Note: Videos are not saved to database anymore, they're returned for frontend display

    return new Response(
      JSON.stringify({ success: true, data: processedVideos, username: cleanUsername, videosFound: processedVideos.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('scrape-tiktok-user error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#\w+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map((t) => t.substring(1).toLowerCase()) : [];
}

function calculateViralScore(likes: number, comments: number, views: number, shares: number): number {
  const engagement = likes + comments * 3 + shares * 5;
  const viewRatio = views > 0 ? engagement / views : 0;
  return Math.round(Math.min(100, engagement * 0.6 + viewRatio * 10000 * 0.4));
}

function calculateEngagementRate(likes: number, comments: number, shares: number, collects: number, views: number): number {
  if (views === 0) return 0;
  const total = likes + comments + shares + collects;
  return total / views;
}
