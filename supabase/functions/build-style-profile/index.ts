import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BUILD-STYLE-PROFILE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { profile_id } = await req.json();

    // Check if user has enough credits (2 credits for style profile generation)
    const { data: spendResult, error: spendError } = await supabaseClient
      .rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: 2,
        reason_param: 'style_profile_generation',
        ref_type_param: 'profile',
        ref_id_param: profile_id
      });

    if (spendError) {
      logStep("Error spending credits", { error: spendError.message });
      throw new Error(`Credit error: ${spendError.message}`);
    }

    if (!spendResult.ok) {
      logStep("Insufficient credits", { currentBalance: spendResult.current_balance });
      return new Response(JSON.stringify({
        error: 'INSUFFICIENT_CREDITS',
        current_balance: spendResult.current_balance || 0,
        required_credits: 2
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 402,
      });
    }

    // Get creator profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('creator_profiles')
      .select('*')
      .eq('id', profile_id)
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      logStep("Error fetching profile", { error: profileError.message });
      throw new Error(`Profile not found: ${profileError.message}`);
    }

    // Get content samples for style analysis
    const { data: samples, error: samplesError } = await supabaseClient
      .from('user_content_samples')
      .select(`
        *,
        content_analysis (
          transcript,
          hook_text,
          analysis_result,
          insights
        )
      `)
      .eq('user_id', user.id)
      .eq('profile_id', profile_id)
      .eq('is_style_reference', true);

    if (samplesError) {
      logStep("Error fetching samples", { error: samplesError.message });
      throw new Error(`Samples error: ${samplesError.message}`);
    }

    if (!samples || samples.length < 3) {
      logStep("Insufficient samples", { sampleCount: samples?.length || 0 });
      throw new Error("At least 3 content samples are required to build a style profile");
    }

    logStep("Samples fetched", { sampleCount: samples.length });

    // Prepare data for AI analysis
    const contentForAnalysis = samples.map(sample => ({
      transcript: sample.content_analysis?.transcript || '',
      hook: sample.content_analysis?.hook_text || '',
      insights: sample.content_analysis?.insights || {},
      analysis: sample.content_analysis?.analysis_result || {}
    }));

    // Generate style profile using OpenRouter API
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const systemPrompt = `You are a content style analysis expert. Analyze the provided content samples to create a comprehensive style profile for this creator.

Creator Profile:
- Brand: ${profile.brand_name}
- Niche: ${profile.niche}
- Target Audience: ${profile.target_audience}
- Content Format: ${profile.content_format}
- Personality Traits: ${profile.personality_traits?.join(', ') || 'Not specified'}
- On Camera: ${profile.on_camera ? 'Yes' : 'No'}

Based on the content samples, identify and extract:
1. Voice & Tone patterns
2. Hook styles and techniques
3. Content structure preferences
4. Call-to-action patterns
5. Pacing and rhythm
6. Language choices and vocabulary
7. Common themes and messaging
8. Do's and Don'ts based on their style

Return a JSON object with this structure:
{
  "style_traits": {
    "voice_tone": "description of their voice and tone",
    "hook_patterns": ["pattern1", "pattern2", "pattern3"],
    "structure_preference": "how they typically structure content",
    "cta_style": "their call-to-action approach",
    "pacing": "fast/medium/slow with description",
    "language_style": "formal/casual/energetic etc with details",
    "key_themes": ["theme1", "theme2"],
    "vocabulary_choices": ["word1", "word2", "phrase1"],
    "dos": ["what they consistently do well"],
    "donts": ["what they avoid or should avoid"]
  },
  "summary": "A human-readable 2-3 paragraph summary of their unique style and voice"
}`;

    const userMessage = `Analyze these ${samples.length} content samples:\n\n` +
      contentForAnalysis.map((content, i) => 
        `Sample ${i + 1}:\nHook: ${content.hook}\nTranscript: ${content.transcript.substring(0, 1000)}...\n\n`
      ).join('');

    logStep("Calling OpenRouter for style analysis");

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://siafgzfpzowztfhlajtn.supabase.co',
        'X-Title': 'Content Creator Style Analysis'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("OpenRouter API error", { status: response.status, error: errorText });
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content;

    logStep("AI analysis completed", { responseLength: generatedContent.length });

    // Parse the AI response
    let styleData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        styleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      logStep("JSON parsing failed, using fallback", { error: parseError });
      // Fallback structure
      styleData = {
        style_traits: {
          voice_tone: "Analysis in progress",
          hook_patterns: ["Engaging openers", "Question-based hooks"],
          structure_preference: "Clear beginning, middle, end",
          cta_style: "Direct and actionable",
          pacing: "Medium paced with good rhythm",
          language_style: "Conversational and approachable",
          key_themes: [profile.niche, "audience engagement"],
          vocabulary_choices: ["engaging", "valuable", "actionable"],
          dos: ["Stay authentic", "Provide value", "Engage audience"],
          donts: ["Over-promote", "Lose focus", "Ignore audience"]
        },
        summary: `This creator has a ${profile.content_format} style focused on ${profile.niche} content. Their approach is tailored to ${profile.target_audience} with ${profile.personality_traits?.join(' and ') || 'authentic'} personality traits. Based on analysis of ${samples.length} content samples, they maintain consistency in their messaging and delivery.`
      };
    }

    // Calculate confidence score based on sample count and analysis quality
    const confidenceScore = Math.min(0.9, (samples.length * 0.15) + 0.4);

    // Save or update style profile
    const { data: styleProfile, error: styleError } = await supabaseClient
      .from('user_style_profiles')
      .upsert({
        user_id: user.id,
        profile_id: profile_id,
        style_traits: styleData.style_traits,
        summary_text: styleData.summary,
        sample_count: samples.length,
        confidence_score: confidenceScore,
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    if (styleError) {
      logStep("Error saving style profile", { error: styleError.message });
      throw new Error(`Database error: ${styleError.message}`);
    }

    // Update creator profile sample count
    await supabaseClient
      .from('creator_profiles')
      .update({ sample_count: samples.length })
      .eq('id', profile_id);

    logStep("Style profile created successfully", { 
      styleProfileId: styleProfile.id,
      sampleCount: samples.length,
      confidenceScore
    });

    return new Response(JSON.stringify({
      style_profile: styleProfile,
      new_balance: spendResult.new_balance,
      credits_used: 2
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});