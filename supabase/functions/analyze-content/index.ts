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
    
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    // Verify content item belongs to user
    const { data: contentItem, error: contentError } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', contentItemId)
      .eq('user_id', user.id)
      .single();

    if (contentError || !contentItem) {
      throw new Error('Content item not found');
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
        video_url: videoUrl,
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
      audio_url: videoUrl,
      auto_chapters: true,
      auto_highlights: true,
      sentiment_analysis: true,
      webhook_url: `${supabaseUrl}/functions/v1/assemblyai-webhook`,
      webhook_auth_header_name: 'Authorization',
      webhook_auth_header_value: `Bearer ${supabaseServiceKey}`
    };

    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': assemblyAIKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transcriptRequest),
    });

    if (!transcriptResponse.ok) {
      throw new Error(`AssemblyAI error: ${await transcriptResponse.text()}`);
    }

    const transcriptData = await transcriptResponse.json();

    // Update analysis with transcript ID and status
    await supabase
      .from('content_analysis')
      .update({
        status: 'transcribing',
        analysis_result: { transcript_id: transcriptData.id }
      })
      .eq('id', analysis.id);

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