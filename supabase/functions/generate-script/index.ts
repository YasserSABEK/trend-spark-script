import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get user from the JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Deduct 1 credit before processing
    const { data: creditResult, error: creditError } = await supabaseClient.rpc('deduct_credits', {
      user_id_param: user.id,
      credits_to_deduct: 1
    });

    if (creditError) {
      console.error('Credit deduction error:', creditError);
      return new Response(
        JSON.stringify({ error: 'Failed to process credits' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!creditResult) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits. You need 1 credit to generate a script.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
      );
    }

    const { 
      prompt, 
      niche, 
      toneOfVoice, 
      targetAudience, 
      hookStyle, 
      reelData 
    } = await req.json();

    console.log('Generating script with:', { niche, toneOfVoice, targetAudience, hookStyle });

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Build context from reel data if provided
    let contextPrompt = '';
    if (reelData) {
      contextPrompt = `
Based on this viral reel:
- Caption: ${reelData.caption || 'N/A'}
- Hashtags: ${reelData.hashtags?.join(', ') || 'N/A'}
- Likes: ${reelData.likes || 0}
- Comments: ${reelData.comments || 0}
- Viral Score: ${reelData.viral_score || 0}
- Engagement Rate: ${reelData.engagement_rate || 0}%
`;
    }

    const systemPrompt = `You are an expert social media content creator specializing in viral Instagram Reels. Your task is to generate high-converting scripts that capture attention and drive engagement.

Context: ${contextPrompt}

Guidelines:
- Niche: ${niche || 'General'}
- Tone: ${toneOfVoice || 'Engaging'}
- Target Audience: ${targetAudience || 'General audience'}
- Hook Style: ${hookStyle || 'Question'}

Generate a script with these exact sections:
1. HOOK (1-2 sentences that grab attention immediately)
2. MAIN_CONTENT (2-3 sentences of valuable content)
3. CALL_TO_ACTION (1 sentence encouraging engagement)
4. HASHTAGS (5-10 relevant hashtags)

Format your response as valid JSON:
{
  "hook": "Your attention-grabbing hook here",
  "mainContent": "Your main content here",
  "callToAction": "Your call to action here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-app-domain.com',
      },
      body: JSON.stringify({
        model: 'openai/o3-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt || 'Generate a viral reel script for me' }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('Generated text:', generatedText);

    // Parse the JSON response
    let scriptData;
    try {
      scriptData = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback: extract content manually if JSON parsing fails
      scriptData = {
        hook: "Attention-grabbing hook",
        mainContent: generatedText.substring(0, 200),
        callToAction: "Like and follow for more!",
        hashtags: ["viral", "content", "creator"]
      };
    }

    // Save to database
    const { data: savedScript, error: saveError } = await supabaseClient
      .from('generated_scripts')
      .insert({
        user_id: user.id,
        title: `${niche || 'Generated'} Script - ${new Date().toLocaleDateString()}`,
        hook: scriptData.hook,
        main_content: scriptData.mainContent,
        call_to_action: scriptData.callToAction,
        suggested_hashtags: scriptData.hashtags,
        niche: niche || null,
        tone_of_voice: toneOfVoice || null,
        target_audience: targetAudience || null,
        hook_style: hookStyle || null,
        performance_score: Math.floor(Math.random() * 100) + 1, // Placeholder
      })
      .select()
      .single();

    if (saveError) {
      console.error('Database save error:', saveError);
      throw new Error('Failed to save script');
    }

    return new Response(
      JSON.stringify({ 
        script: savedScript,
        generated: scriptData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-script function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});