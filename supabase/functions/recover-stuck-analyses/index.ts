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
    console.log('Starting recovery of stuck analyses...');

    // Find analyses stuck in transcribing status for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: stuckAnalyses, error: queryError } = await supabase
      .from('content_analysis')
      .select('*')
      .eq('status', 'transcribing')
      .lt('created_at', tenMinutesAgo);

    if (queryError) {
      throw new Error(`Failed to query stuck analyses: ${queryError.message}`);
    }

    console.log(`Found ${stuckAnalyses?.length || 0} stuck analyses`);

    if (!stuckAnalyses || stuckAnalyses.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No stuck analyses found',
        recovered: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let recovered = 0;
    let failed = 0;

    for (const analysis of stuckAnalyses) {
      try {
        const transcriptId = analysis.analysis_result?.transcript_id;
        
        if (!transcriptId) {
          console.log(`Analysis ${analysis.id} has no transcript ID, marking as failed`);
          await supabase
            .from('content_analysis')
            .update({
              status: 'failed',
              error_message: 'No transcript ID found',
              completed_at: new Date().toISOString()
            })
            .eq('id', analysis.id);
          
          // Refund credits
          await supabase.rpc('add_credits', {
            user_id_param: analysis.user_id,
            credits_to_add: analysis.credits_used || 1
          });
          
          failed++;
          continue;
        }

        console.log(`Recovering analysis ${analysis.id} with transcript ${transcriptId}`);

        // Try to get transcript from AssemblyAI
        const transcriptResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            'Authorization': assemblyAIKey!,
          },
        });

        if (!transcriptResponse.ok) {
          console.log(`Failed to fetch transcript ${transcriptId}: ${transcriptResponse.status}`);
          await supabase
            .from('content_analysis')
            .update({
              status: 'failed',
              error_message: 'Failed to fetch transcript from AssemblyAI',
              completed_at: new Date().toISOString()
            })
            .eq('id', analysis.id);
          
          // Refund credits
          await supabase.rpc('add_credits', {
            user_id_param: analysis.user_id,
            credits_to_add: analysis.credits_used || 1
          });
          
          failed++;
          continue;
        }

        const transcriptData = await transcriptResponse.json();

        if (transcriptData.status === 'completed') {
          // Extract hook text (first few words from transcript)
          const hookText = transcriptData.text?.substring(0, 200) || '';

          // Create basic sections with timestamps
          const sections = transcriptData.chapters?.map((chapter: any, index: number) => ({
            id: index,
            type: index === 0 ? 'Hook' : index === transcriptData.chapters.length - 1 ? 'CTA' : 'Build-up',
            start: chapter.start,
            end: chapter.end,
            summary: chapter.summary,
            headline: chapter.headline
          })) || [];

          // Basic analysis without LeMUR
          const basicAnalysisResults = {
            hook: hookText.split('.')[0] || hookText.substring(0, 50),
            sections: [],
            ctas: [],
            claims: [],
            emotions: [],
            curiosity: [],
            specificity: [],
            pacing: 'Normal pace detected',
            viral_factors: ['Engaging content structure', 'Clear audio quality']
          };

          // Update analysis with results
          const updateData = {
            status: 'completed',
            completed_at: new Date().toISOString(),
            transcript: transcriptData.text,
            hook_text: hookText,
            sections: sections,
            insights: {
              sentiment: transcriptData.sentiment_analysis_results || [],
              key_phrases: transcriptData.auto_highlights_result?.results || [],
              viral_analysis: basicAnalysisResults.viral_factors,
              emotions: [],
              pacing: basicAnalysisResults.pacing,
              specificity: [],
              lemur_available: false,
              recovered: true
            },
            analysis_result: {
              ...transcriptData,
              lemur_analysis: basicAnalysisResults,
              recovered: true
            },
            video_duration: transcriptData.audio_duration ? transcriptData.audio_duration / 1000 : null
          };

          await supabase
            .from('content_analysis')
            .update(updateData)
            .eq('id', analysis.id);

          console.log(`Successfully recovered analysis ${analysis.id}`);
          recovered++;

        } else if (transcriptData.status === 'error') {
          await supabase
            .from('content_analysis')
            .update({
              status: 'failed',
              error_message: transcriptData.error || 'Transcription failed',
              completed_at: new Date().toISOString()
            })
            .eq('id', analysis.id);

          // Refund credits
          await supabase.rpc('add_credits', {
            user_id_param: analysis.user_id,
            credits_to_add: analysis.credits_used || 1
          });

          failed++;
        } else {
          console.log(`Transcript ${transcriptId} still processing, status: ${transcriptData.status}`);
        }

      } catch (error) {
        console.error(`Error recovering analysis ${analysis.id}:`, error);
        failed++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Recovery completed: ${recovered} recovered, ${failed} failed`,
      recovered,
      failed 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Recovery error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});