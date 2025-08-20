import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const assemblyAIKey = Deno.env.get('ASSEMBLYAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentItemId, videoUrl, deeperAnalysis = false } = await req.json();

    if (!contentItemId) {
      return new Response('Content item ID is required', { status: 400 });
    }

    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Authorization header is required', { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response('Invalid authentication', { status: 401 });
    }

    // Verify content item belongs to user
    const { data: contentItem, error: contentError } = await supabase
      .from('content_items')
      .select('*, source_url')
      .eq('id', contentItemId)
      .eq('user_id', user.id)
      .single();

    if (contentError || !contentItem) {
      return new Response('Content item not found', { status: 404 });
    }

    let finalVideoUrl = videoUrl;

    // Handle Instagram content - extract video URL using Apify
    if (contentItem.platform === 'instagram' && !videoUrl) {
      console.log('Extracting Instagram video URL...');
      const { data: extractionResult, error: extractionError } = await supabase.functions.invoke('extract-instagram-video', {
        body: { instagramUrl: contentItem.source_url }
      });

      if (extractionError || !extractionResult?.success) {
        throw new Error(`Failed to extract Instagram video: ${extractionError?.message || extractionResult?.error}`);
      }

      finalVideoUrl = extractionResult.videoUrl;
      console.log('Extracted Instagram video URL:', finalVideoUrl);
    }

    // Handle TikTok content - extract video URL using extraction service
    if (contentItem.platform === 'tiktok' && !videoUrl) {
      console.log('Extracting TikTok video URL...');
      const { data: extractionResult, error: extractionError } = await supabase.functions.invoke('extract-tiktok-video', {
        body: { tiktokUrl: contentItem.source_url }
      });

      if (extractionError || !extractionResult?.success) {
        return new Response(JSON.stringify({ 
          error: `Failed to extract TikTok video. ${extractionResult?.actor ? `Last tried: ${extractionResult.actor}` : 'All extraction methods failed.'}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      finalVideoUrl = extractionResult.videoUrl;
      console.log('Extracted TikTok video URL:', finalVideoUrl);
    }

    if (!finalVideoUrl) {
      throw new Error('No video URL available for analysis');
    }

    // Test if video URL is accessible
    try {
      const testResponse = await fetch(finalVideoUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        throw new Error(`Video URL not accessible: ${testResponse.status}`);
      }
      console.log('Video URL accessibility confirmed');
    } catch (error) {
      console.error('Video URL test failed:', error);
      throw new Error('Video URL is not accessible to external services');
    }

    // Calculate credits needed based on video duration (we'll estimate for now)
    let creditsNeeded = 1; // Default for ≤90s
    if (deeperAnalysis) creditsNeeded += 1;

    // Check and deduct credits
    const { data: creditResult, error: creditError } = await supabase.rpc('safe_deduct_credits', {
      user_id_param: user.id,
      credits_to_deduct: creditsNeeded
    });

    if (creditError || !creditResult?.success) {
      throw new Error('Insufficient credits');
    }

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('content_analysis')
      .insert({
        content_item_id: contentItemId,
        user_id: user.id,
        video_url: finalVideoUrl,
        status: 'queued',
        deeper_analysis: deeperAnalysis,
        credits_used: creditsNeeded
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error creating analysis:', analysisError);
      throw new Error('Failed to create analysis');
    }

    // Start AssemblyAI transcription
    if (!assemblyAIKey) {
      throw new Error('AssemblyAI API key not configured');
    }

    const transcriptRequest = {
      audio_url: finalVideoUrl,
      auto_chapters: true,
      auto_highlights: true,
      sentiment_analysis: true,
      webhook_url: `${supabaseUrl}/functions/v1/assemblyai-webhook`,
      webhook_auth_header_name: 'Authorization',
      webhook_auth_header_value: `Bearer ${supabaseServiceKey}`
    };

    console.log('Starting AssemblyAI transcription for URL:', finalVideoUrl);
    
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${assemblyAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transcriptRequest),
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('AssemblyAI API error:', errorText);
      throw new Error(`AssemblyAI error: ${errorText}`);
    }

    const transcriptData = await transcriptResponse.json();
    console.log('AssemblyAI transcript created:', transcriptData.id);

    // Update analysis with transcript ID and status
    await supabase
      .from('content_analysis')
      .update({
        status: 'transcribing',
        video_url: finalVideoUrl,
        analysis_result: { transcript_id: transcriptData.id }
      })
      .eq('id', analysis.id);

    console.log('Analysis record updated with transcript ID:', transcriptData.id);

    return new Response(JSON.stringify({
      success: true,
      analysisId: analysis.id,
      status: 'transcribing'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-content:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});