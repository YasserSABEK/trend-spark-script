import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATOR-PROFILE] ${step}${detailsStr}`);
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

    // Parse request body to determine action
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      logStep("Error parsing JSON", { error: error.message });
      throw new Error("Invalid JSON in request body");
    }

    const action = requestBody.action || 'get';
    logStep("Action determined", { action });
    
    if (action === 'get') {
      // Get creator profile
      const { data: profile, error } = await supabaseClient
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logStep("Error fetching profile", { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }

      logStep("Profile fetched", { profileExists: !!profile });

      return new Response(JSON.stringify({ profile }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'create') {
      // Create creator profile
      const profileData = requestBody;
      
      const { data: profile, error } = await supabaseClient
        .from('creator_profiles')
        .insert({
          user_id: user.id,
          brand_name: profileData.brand_name,
          niche: profileData.niche,
          target_audience: profileData.target_audience,
          content_goals: profileData.content_goals || [],
          on_camera: profileData.on_camera || false,
          content_format: profileData.content_format,
          personality_traits: profileData.personality_traits || [],
          instagram_handle: profileData.instagram_handle,
          profile_status: profileData.profile_status || 'draft'
        })
        .select()
        .single();

      if (error) {
        logStep("Error creating profile", { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }

      logStep("Profile created", { profileId: profile.id });

      return new Response(JSON.stringify({ profile }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    if (action === 'update') {
      // Update creator profile
      const profileData = requestBody;
      
      const { data: profile, error } = await supabaseClient
        .from('creator_profiles')
        .update({
          brand_name: profileData.brand_name,
          niche: profileData.niche,
          target_audience: profileData.target_audience,
          content_goals: profileData.content_goals,
          on_camera: profileData.on_camera,
          content_format: profileData.content_format,
          personality_traits: profileData.personality_traits,
          instagram_handle: profileData.instagram_handle,
          profile_status: profileData.profile_status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        logStep("Error updating profile", { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }

      logStep("Profile updated", { profileId: profile.id });

      return new Response(JSON.stringify({ profile }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: `Action '${action}' not allowed` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
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