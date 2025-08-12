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
    const webhook = await req.json();
    const transcriptId = webhook.transcript_id;
    const status = webhook.status;

    console.log('Webhook received:', { transcriptId, status });

    // Find the analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('content_analysis')
      .select('*')
      .eq('analysis_result->>transcript_id', transcriptId)
      .single();

    if (analysisError || !analysis) {
      console.error('Analysis not found:', analysisError);
      return new Response('Analysis not found', { status: 404 });
    }

    if (status === 'completed') {
      // Get transcript data from AssemblyAI
      const transcriptResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': assemblyAIKey!,
        },
      });

      if (!transcriptResponse.ok) {
        throw new Error(`Failed to fetch transcript: ${await transcriptResponse.text()}`);
      }

      const transcriptData = await transcriptResponse.json();

      // Use LeMUR to analyze the content
      const lemurResponse = await fetch('https://api.assemblyai.com/lemur/v3/generate/task', {
        method: 'POST',
        headers: {
          'Authorization': assemblyAIKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript_ids: [transcriptId],
          prompt: `Analyze this video transcript for content creation insights. Extract:

1. HOOK (first 3-5 seconds): Identify the opening hook that grabs attention
2. SECTIONS: Break down the content into Hook → Build-up → Payoff → CTA with timestamps
3. CTAS: Identify all calls-to-action
4. STRONG CLAIMS: List compelling statements or claims made
5. EMOTION CUES: Identify emotional triggers and sentiment shifts
6. CURIOSITY TRIGGERS: What makes viewers want to keep watching
7. SPECIFICITY: Use of specific numbers, facts, or details
8. PACING NOTES: Analysis of speech pace and rhythm
9. VIRAL PATTERNS: What elements likely contributed to virality

Return as structured JSON with these exact keys: hook, sections, ctas, claims, emotions, curiosity, specificity, pacing, viral_factors`,
        }),
      });

      if (!lemurResponse.ok) {
        throw new Error(`LeMUR analysis failed: ${await lemurResponse.text()}`);
      }

      const lemurData = await lemurResponse.json();
      let analysisResults;
      
      try {
        analysisResults = JSON.parse(lemurData.response);
      } catch {
        // If not valid JSON, create structured response
        analysisResults = {
          hook: lemurData.response.split('HOOK:')[1]?.split('SECTIONS:')[0]?.trim() || '',
          sections: [],
          ctas: [],
          claims: [],
          emotions: [],
          curiosity: [],
          specificity: [],
          pacing: '',
          viral_factors: []
        };
      }

      // Extract hook text (first few words from transcript)
      const hookText = transcriptData.text?.substring(0, 200) || '';

      // Create sections with timestamps
      const sections = transcriptData.chapters?.map((chapter: any, index: number) => ({
        id: index,
        type: index === 0 ? 'Hook' : index === transcriptData.chapters.length - 1 ? 'CTA' : 'Build-up',
        start: chapter.start,
        end: chapter.end,
        summary: chapter.summary,
        headline: chapter.headline
      })) || [];

      // Update analysis with results
      const updateData = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        transcript: transcriptData.text,
        hook_text: hookText,
        sections: sections,
        insights: {
          sentiment: transcriptData.sentiment_analysis_results,
          key_phrases: transcriptData.auto_highlights_result?.results || [],
          viral_analysis: analysisResults.viral_factors || [],
          emotions: analysisResults.emotions || [],
          pacing: analysisResults.pacing || '',
          specificity: analysisResults.specificity || []
        },
        analysis_result: {
          ...transcriptData,
          lemur_analysis: analysisResults
        },
        video_duration: transcriptData.audio_duration / 1000 // Convert to seconds
      };

      // Adjust credits based on actual duration
      let finalCredits = 1; // ≤90s
      if (updateData.video_duration > 90 && updateData.video_duration <= 180) {
        finalCredits = 2;
      }
      if (analysis.deeper_analysis) {
        finalCredits += 1;
      }

      // If we charged too much, refund the difference
      if (analysis.credits_used > finalCredits) {
        const refund = analysis.credits_used - finalCredits;
        await supabase.rpc('add_credits', {
          user_id_param: analysis.user_id,
          credits_to_add: refund
        });
        updateData.credits_used = finalCredits;
      }

      await supabase
        .from('content_analysis')
        .update(updateData)
        .eq('id', analysis.id);

      console.log('Analysis completed successfully');

    } else if (status === 'error') {
      // Handle transcription error
      await supabase
        .from('content_analysis')
        .update({
          status: 'failed',
          error_message: webhook.error || 'Transcription failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', analysis.id);

      // Refund credits on failure
      await supabase.rpc('add_credits', {
        user_id_param: analysis.user_id,
        credits_to_add: analysis.credits_used
      });

      console.log('Analysis failed, credits refunded');
    }

    return new Response('OK', { headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});