import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENHANCED-SCRIPT-GENERATION] ${step}${detailsStr}`);
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

    const { 
      post_id, 
      highAccuracy = false, 
      idempotency_key = `script_${post_id}_${Date.now()}`,
      prompt,
      niche,
      tone,
      audience,
      format = 'reel'
    } = await req.json();

    logStep("Request parameters", { post_id, highAccuracy, format });

    // Calculate credit cost
    const baseCost = 1;
    const highAccuracyCost = highAccuracy ? 1 : 0;
    const totalCost = baseCost + highAccuracyCost;

    logStep("Credit calculation", { baseCost, highAccuracyCost, totalCost });

    // Spend credits
    const { data: spendResult, error: spendError } = await supabaseClient
      .rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: totalCost,
        reason_param: 'script_generation',
        ref_type_param: 'post',
        ref_id_param: post_id,
        idempotency_key_param: idempotency_key
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
        required_credits: totalCost
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 402,
      });
    }

    logStep("Credits spent successfully", { newBalance: spendResult.new_balance });

    // Generate script using AI (mock implementation)
    const scriptData = await generateScript({
      prompt,
      niche,
      tone,
      audience,
      format,
      highAccuracy,
      post_id
    });

    logStep("Script generated", { scriptLength: scriptData.main_content.length });

    // Save script to database
    const { data: savedScript, error: saveError } = await supabaseClient
      .from('generated_scripts')
      .insert({
        user_id: user.id,
        reel_id: post_id,
        title: scriptData.title,
        hook: scriptData.hook,
        main_content: scriptData.main_content,
        call_to_action: scriptData.call_to_action,
        suggested_hashtags: scriptData.suggested_hashtags,
        performance_score: scriptData.performance_score,
        niche: niche,
        tone_of_voice: tone,
        target_audience: audience,
        format_type: format,
        brand_voice: highAccuracy ? 'premium' : 'standard'
      })
      .select()
      .single();

    if (saveError) {
      logStep("Error saving script", { error: saveError.message });
      throw new Error(`Database error: ${saveError.message}`);
    }

    logStep("Script saved successfully", { scriptId: savedScript.id });

    return new Response(JSON.stringify({
      script: savedScript,
      new_balance: spendResult.new_balance,
      credits_used: totalCost,
      high_accuracy_used: highAccuracy
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

async function generateScript(params: {
  prompt: string;
  niche: string;
  tone: string;
  audience: string;
  format: string;
  highAccuracy: boolean;
  post_id: string;
}) {
  logStep("Generating script with AI", params);

  // Mock implementation - replace with actual OpenAI/LLM integration
  const baseScript = {
    title: `Engaging ${params.format} Script`,
    hook: `🔥 ${params.audience}, this will blow your mind!`,
    main_content: `This is a ${params.tone} script about ${params.niche}. ${params.prompt}\n\nHere's the main content that would be generated based on your requirements. In a real implementation, this would use advanced AI to create compelling, personalized content.`,
    call_to_action: `Don't forget to like and follow for more ${params.niche} content!`,
    suggested_hashtags: [`#${params.niche}`, '#viral', '#trending', '#fyp', '#content'],
    performance_score: params.highAccuracy ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 30) + 50
  };

  if (params.highAccuracy) {
    baseScript.main_content += '\n\n[ENHANCED WITH HIGH ACCURACY]: This version includes advanced optimization, better hooks, and data-driven insights for maximum engagement.';
    baseScript.suggested_hashtags.push('#premium', '#optimized');
  }

  return baseScript;
}