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

    // Calculate credits needed - always 1 credit for any analysis
    let creditsNeeded = 1;

    console.log('Credit deduction - Function version: 2025-08-20-v3, timestamp:', new Date().toISOString());
    console.log('Credit deduction - User ID:', user.id);
    console.log('Credit deduction - Credits needed:', creditsNeeded);

    // Get current user credits for debugging
    const { data: currentCredits, error: creditsCheckError } = await supabase
      .from('credit_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    console.log('Credit deduction - Current balance query result:', { currentCredits, creditsCheckError });

    // Check and deduct credits with retry logic
    let creditResult = null;
    let creditError = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Credit deduction - Attempt ${attempts}/${maxAttempts}`);

      const result = await supabase.rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: creditsNeeded,
        reason_param: 'Content analysis',
        ref_type_param: 'content_analysis',
        ref_id_param: contentItemId
      });

      creditResult = result.data;
      creditError = result.error;

      console.log(`Credit deduction - Attempt ${attempts} result:`, { creditResult, creditError });

      // If successful, break out of retry loop
      if (!creditError && creditResult?.ok) {
        console.log('Credit deduction - Success on attempt', attempts);
        break;
      }

      // If it's a genuine insufficient credits error, don't retry
      if (creditResult && !creditResult.ok && creditResult.error === 'INSUFFICIENT_CREDITS') {
        console.log('Credit deduction - Genuine insufficient credits, not retrying');
        break;
      }

      // Wait a bit before retrying (exponential backoff)
      if (attempts < maxAttempts) {
        const delay = Math.pow(2, attempts - 1) * 1000; // 1s, 2s, 4s
        console.log(`Credit deduction - Waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Enhanced error handling with detailed messages
    if (creditError) {
      console.error('Credit deduction - Database error:', creditError);
      throw new Error(`Credit system error: ${creditError.message || 'Database connection failed'}`);
    }

    if (!creditResult?.ok) {
      const errorMsg = creditResult?.error || 'Unknown credit error';
      const remainingCredits = creditResult?.new_balance || 'unknown';
      console.error('Credit deduction - Deduction failed:', { errorMsg, remainingCredits, creditResult });
      
      if (errorMsg === 'INSUFFICIENT_CREDITS') {
        throw new Error(`Insufficient credits. You have ${creditResult?.current_balance || 'unknown'} credits but need ${creditsNeeded} credits for this analysis.`);
      } else {
        throw new Error(`Credit deduction failed: ${errorMsg}`);
      }
    }

    console.log('Credit deduction - Successful deduction. New balance:', creditResult.new_balance);

    // Create analysis record with rollback capability
    let analysis = null;
    try {
      const { data: analysisData, error: analysisError } = await supabase
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
        throw new Error('Failed to create analysis record');
      }

      analysis = analysisData;
      console.log('Analysis record created:', analysis.id);

    } catch (error) {
      console.error('Analysis creation failed, attempting credit rollback:', error);
      // Attempt to refund credits using the new credit system
      try {
        await supabase.rpc('spend_credits', {
          user_id_param: user.id,
          amount_param: -creditsNeeded, // Negative amount for refund
          reason_param: 'Refund - Analysis creation failed',
          ref_type_param: 'refund',
          ref_id_param: contentItemId
        });
        console.log('Credits refunded due to analysis creation failure');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
      throw error;
    }

    // Start AssemblyAI transcription with rollback capability
    if (!assemblyAIKey) {
      // Rollback analysis and credits before throwing error
      await supabase.from('content_analysis').delete().eq('id', analysis.id);
      await supabase.rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: -creditsNeeded, // Negative amount for refund
        reason_param: 'Refund - AssemblyAI not configured',
        ref_type_param: 'refund',
        ref_id_param: contentItemId
      });
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
    
    let transcriptData = null;
    try {
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

      transcriptData = await transcriptResponse.json();
      console.log('AssemblyAI transcript created:', transcriptData.id);

    } catch (error) {
      console.error('AssemblyAI transcription failed, attempting rollback:', error);
      
      // Update analysis status to failed
      await supabase
        .from('content_analysis')
        .update({
          status: 'failed',
          error_message: `Transcription failed: ${error.message}`
        })
        .eq('id', analysis.id);

      // Refund credits using the new credit system
      try {
        await supabase.rpc('spend_credits', {
          user_id_param: user.id,
          amount_param: -creditsNeeded, // Negative amount for refund
          reason_param: 'Refund - Transcription failed',
          ref_type_param: 'refund',
          ref_id_param: contentItemId
        });
        console.log('Credits refunded due to transcription failure');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }

      throw new Error(`Transcription service failed: ${error.message}`);
    }

    // Update analysis with transcript ID and status
    try {
      await supabase
        .from('content_analysis')
        .update({
          status: 'transcribing',
          video_url: finalVideoUrl,
          analysis_result: { transcript_id: transcriptData.id }
        })
        .eq('id', analysis.id);

      console.log('Analysis record updated with transcript ID:', transcriptData.id);
    } catch (error) {
      console.error('Failed to update analysis record:', error);
      // Log but don't fail the entire process since transcription is already started
    }

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