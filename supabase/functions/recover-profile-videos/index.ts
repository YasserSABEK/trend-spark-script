import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid user token');
    }

    const { profileId } = await req.json();

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    console.log(`Recovering video samples for profile ${profileId} and user ${user.id}`);

    // Find content items that have been processed but don't have user_content_samples
    const { data: processedItems, error: itemsError } = await supabase
      .from('content_items')
      .select(`
        id,
        source_url,
        platform,
        caption,
        thumbnail_url,
        status,
        created_at,
        content_analysis!inner (
          id,
          status,
          transcript,
          hook_text,
          video_duration,
          completed_at
        )
      `)
      .eq('user_id', user.id)
      .contains('tags', ['style_sample', 'profile_setup'])
      .eq('content_analysis.status', 'completed');

    if (itemsError) {
      console.error('Error fetching processed items:', itemsError);
      throw new Error('Failed to fetch processed content items');
    }

    if (!processedItems || processedItems.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No processed videos found to recover',
        recovered: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${processedItems.length} processed items to check`);

    // Check which ones don't have user_content_samples
    const itemsNeedingRecovery = [];
    
    for (const item of processedItems) {
      const { data: existingSample } = await supabase
        .from('user_content_samples')
        .select('id')
        .eq('content_item_id', item.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (!existingSample) {
        itemsNeedingRecovery.push(item);
      }
    }

    console.log(`Found ${itemsNeedingRecovery.length} items needing recovery`);

    if (itemsNeedingRecovery.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All processed videos already have samples',
        recovered: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user_content_samples for the missing items
    const sampleInserts = itemsNeedingRecovery.map(item => ({
      user_id: user.id,
      profile_id: profileId,
      content_item_id: item.id,
      analysis_id: item.content_analysis[0].id,
      is_style_reference: true,
      style_tags: ['profile_setup', 'recovered']
    }));

    const { error: insertError } = await supabase
      .from('user_content_samples')
      .insert(sampleInserts);

    if (insertError) {
      console.error('Error creating recovered samples:', insertError);
      throw new Error('Failed to create recovered video samples');
    }

    console.log(`Successfully recovered ${itemsNeedingRecovery.length} video samples`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully recovered ${itemsNeedingRecovery.length} video samples`,
      recovered: itemsNeedingRecovery.length,
      samples: itemsNeedingRecovery.map(item => ({
        contentItemId: item.id,
        sourceUrl: item.source_url,
        platform: item.platform,
        status: 'recovered'
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Recovery error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});