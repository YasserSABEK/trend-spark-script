import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const apifyApiKey = Deno.env.get('APIFY_API_KEY')!;
const assemblyAiApiKey = Deno.env.get('ASSEMBLYAI_API_KEY')!;
const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ExtractAndRewriteRequest {
  instagramUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[extract-and-rewrite-script] Starting request processing');

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[extract-and-rewrite-script] Auth error:', authError);
      throw new Error('Authentication failed');
    }

    console.log('[extract-and-rewrite-script] User authenticated:', user.id);

    // Parse request body
    const { instagramUrl }: ExtractAndRewriteRequest = await req.json();

    if (!instagramUrl) {
      throw new Error('Instagram URL is required');
    }

    console.log('[extract-and-rewrite-script] Processing Instagram URL:', instagramUrl);

    // Validate Instagram URL
    const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels)\/[A-Za-z0-9_-]+/;
    if (!instagramRegex.test(instagramUrl)) {
      throw new Error('Invalid Instagram URL format');
    }

    // Step 1: Extract video using Apify
    console.log('[extract-and-rewrite-script] Extracting video with Apify');
    
    const apifyResponse = await fetch(`https://api.apify.com/v2/acts/epctex~instagram-video-downloader/run-sync-get-dataset-items?token=${apifyApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [{ url: instagramUrl }],
        includeAudio: true
      }),
    });

    if (!apifyResponse.ok) {
      throw new Error(`Apify request failed: ${apifyResponse.statusText}`);
    }

    const apifyData = await apifyResponse.json();
    console.log('[extract-and-rewrite-script] Apify response received');

    if (!apifyData || apifyData.length === 0) {
      throw new Error('No video data found');
    }

    const videoData = apifyData[0];
    const videoUrl = videoData.videoUrl;

    if (!videoUrl) {
      throw new Error('No video URL found in response');
    }

    console.log('[extract-and-rewrite-script] Video URL extracted:', videoUrl);

    // Step 2: Transcribe with AssemblyAI
    console.log('[extract-and-rewrite-script] Starting transcription with AssemblyAI');
    
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': assemblyAiApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: videoUrl,
        speech_model: 'best'
      }),
    });

    if (!transcriptResponse.ok) {
      throw new Error(`AssemblyAI request failed: ${transcriptResponse.statusText}`);
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

    console.log('[extract-and-rewrite-script] Transcript submitted, ID:', transcriptId);

    // Poll for transcript completion
    let transcript = '';
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': assemblyAiApiKey,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`AssemblyAI status check failed: ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      
      if (statusData.status === 'completed') {
        transcript = statusData.text;
        console.log('[extract-and-rewrite-script] Transcript completed');
        break;
      } else if (statusData.status === 'error') {
        throw new Error(`Transcription failed: ${statusData.error}`);
      }
      
      attempts++;
      console.log('[extract-and-rewrite-script] Waiting for transcript, attempt:', attempts);
    }

    if (!transcript) {
      throw new Error('Transcription timeout - video may be too long or have no speech');
    }

    // Step 3: Get user's style profile
    console.log('[extract-and-rewrite-script] Fetching user style profile');
    
    const { data: styleProfile, error: styleError } = await supabase
      .from('user_style_profiles')
      .select('style_profile')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let styleProfileJson = null;
    if (styleProfile && styleProfile.style_profile) {
      styleProfileJson = styleProfile.style_profile;
      console.log('[extract-and-rewrite-script] Style profile found');
    } else {
      console.log('[extract-and-rewrite-script] No style profile found, using generic approach');
    }

    // Step 4: Rewrite script with OpenRouter
    console.log('[extract-and-rewrite-script] Rewriting script with OpenRouter');
    
    const systemPrompt = `You are a script editor for a short-form content creator. Take the transcript below and rewrite it into a fresh, platform-optimized short-form video script using this creator's style traits:

TRANSCRIPT:
${transcript}

CREATOR STYLE PROFILE:
${styleProfileJson ? JSON.stringify(styleProfileJson, null, 2) : 'No specific style profile available - use engaging, conversational tone'}

Focus on a strong hook, tight flow, and natural language. Use a structure like: Hook → Value → CTA. Limit the new script to ~60 seconds of speech. Keep the style consistent with the tone provided. Do not reuse boring or redundant sentences.

Return only the rewritten script text without any additional formatting or explanations.`;

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': supabaseUrl,
        'X-Title': 'Script Rewriter'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('[extract-and-rewrite-script] OpenRouter error:', errorText);
      throw new Error(`Script rewriting failed: ${openRouterResponse.statusText}`);
    }

    const openRouterData = await openRouterResponse.json();
    
    if (!openRouterData.choices || !openRouterData.choices[0] || !openRouterData.choices[0].message) {
      throw new Error('Invalid response from script rewriting service');
    }

    const rewrittenScript = openRouterData.choices[0].message.content.trim();
    
    console.log('[extract-and-rewrite-script] Script rewritten successfully');

    // Step 5: Deduct credits (optional - you may want to implement this)
    // const { error: creditError } = await supabase.rpc('spend_credits', {
    //   user_id_param: user.id,
    //   amount_param: 2, // Cost for extraction + rewriting
    //   reason_param: 'Instagram script extraction and rewriting'
    // });

    return new Response(
      JSON.stringify({ 
        rewrittenScript,
        originalTranscript: transcript,
        videoUrl: videoUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[extract-and-rewrite-script] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to extract and rewrite script',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});