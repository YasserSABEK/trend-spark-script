import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const assemblyAiApiKey = Deno.env.get('ASSEMBLYAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VideoProcessingRequest {
  videoUrls: string[];
  profileId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid user token');
    }

    const { videoUrls, profileId }: VideoProcessingRequest = await req.json();

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      throw new Error('No video URLs provided');
    }

    if (!assemblyAiApiKey) {
      throw new Error('AssemblyAI API key not configured');
    }

    console.log(`Processing ${videoUrls.length} videos for user ${user.id}`);

    const processedVideos = [];
    const errors = [];

    for (let i = 0; i < videoUrls.length; i++) {
      const videoUrl = videoUrls[i];
      
      try {
        console.log(`Processing video ${i + 1}/${videoUrls.length}: ${videoUrl}`);

        // Validate Instagram URL format
        if (!videoUrl.includes('instagram.com') || (!videoUrl.includes('/reel/') && !videoUrl.includes('/p/'))) {
          throw new Error('Invalid Instagram URL format');
        }

        // Extract video URL using existing function
        const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-instagram-video', {
          body: { instagramUrl: videoUrl }
        });

        if (extractError || !extractData?.success) {
          throw new Error(`Failed to extract video: ${extractData?.error || 'Unknown error'}`);
        }

        const actualVideoUrl = extractData.videoUrl;
        const caption = extractData.caption || '';
        const metadata = extractData.metadata || {};

        // Check video duration (3 minutes max = 180 seconds)
        if (metadata.duration && metadata.duration > 180) {
          throw new Error('Video exceeds 3-minute limit');
        }

        // Create content item
        const { data: contentItem, error: contentError } = await supabase
          .from('content_items')
          .insert({
            user_id: user.id,
            platform: 'instagram',
            source_url: videoUrl,
            thumbnail_url: metadata.thumbnail_url,
            caption: caption,
            status: 'processing',
            tags: ['style_sample', 'profile_setup']
          })
          .select()
          .single();

        if (contentError || !contentItem) {
          throw new Error('Failed to create content item');
        }

        // Start transcription with AssemblyAI
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
          method: 'POST',
          headers: {
            'Authorization': assemblyAiApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_url: actualVideoUrl,
            language_detection: true,
            auto_highlights: true,
            sentiment_analysis: true,
            entity_detection: true,
            speaker_labels: false,
            punctuate: true,
            format_text: true,
            webhook_url: `${supabaseUrl}/functions/v1/assemblyai-webhook`,
            webhook_auth_header_name: 'authorization',
            webhook_auth_header_value: `Bearer ${supabaseServiceKey}`,
          }),
        });

        if (!transcriptResponse.ok) {
          throw new Error(`AssemblyAI error: ${await transcriptResponse.text()}`);
        }

        const transcriptData = await transcriptResponse.json();

        // Create analysis record
        const { data: analysis, error: analysisError } = await supabase
          .from('content_analysis')
          .insert({
            content_item_id: contentItem.id,
            user_id: user.id,
            video_url: actualVideoUrl,
            status: 'processing',
            deeper_analysis: false,
            credits_used: 0, // Free during profile setup
          })
          .select()
          .single();

        if (analysisError || !analysis) {
          throw new Error('Failed to create analysis record');
        }

        // Update analysis with AssemblyAI transcript ID
        await supabase
          .from('content_analysis')
          .update({
            analysis_result: { 
              transcript_id: transcriptData.id,
              assemblyai_status: 'queued',
              profile_setup: true
            }
          })
          .eq('id', analysis.id);

        processedVideos.push({
          videoUrl,
          contentItemId: contentItem.id,
          analysisId: analysis.id,
          transcriptId: transcriptData.id,
          status: 'processing'
        });

      } catch (error) {
        console.error(`Error processing video ${videoUrl}:`, error);
        errors.push({
          videoUrl,
          error: error.message
        });
      }
    }

    // Create user content samples for successfully processed videos
    if (processedVideos.length > 0) {
      const sampleInserts = processedVideos.map(video => ({
        user_id: user.id,
        profile_id: profileId,
        content_item_id: video.contentItemId,
        analysis_id: video.analysisId,
        is_style_reference: true,
        style_tags: ['profile_setup']
      }));

      await supabase
        .from('user_content_samples')
        .insert(sampleInserts);
    }

    return new Response(JSON.stringify({
      success: true,
      processedVideos,
      errors,
      totalProcessed: processedVideos.length,
      totalErrors: errors.length,
      message: processedVideos.length > 0 
        ? `Successfully started processing ${processedVideos.length} video(s)`
        : 'No videos could be processed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Profile video processing error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});