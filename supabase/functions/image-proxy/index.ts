import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      return new Response('Missing url parameter', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Enhanced validation for Instagram and CDN URLs
    const validDomains = [
      'instagram.com',
      'cdninstagram.com',
      'fbcdn.net',
      'scontent',
      'instagram.f'
    ];
    
    const isValidUrl = validDomains.some(domain => imageUrl.includes(domain));
    if (!isValidUrl) {
      console.error(`Invalid image source: ${imageUrl}`);
      return new Response('Invalid image source', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    console.log(`Proxying image: ${imageUrl}`);

    // Enhanced headers for Instagram CDN compatibility
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.instagram.com/',
      'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
    };

    // Retry logic for failed requests
    let response;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        response = await fetch(imageUrl, {
          headers: fetchHeaders,
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (response.ok) {
          break;
        }
        
        console.warn(`Attempt ${attempts + 1} failed: ${response.status} ${response.statusText}`);
        attempts++;
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
        }
      } catch (fetchError) {
        console.error(`Fetch attempt ${attempts + 1} error:`, fetchError);
        attempts++;
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    if (!response || !response.ok) {
      const status = response?.status || 500;
      const statusText = response?.statusText || 'Network Error';
      console.error(`All attempts failed. Final status: ${status} ${statusText}`);
      
      // Return a more helpful error response
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch image', 
        status, 
        url: imageUrl.substring(0, 100) + '...' 
      }), { 
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Enhanced caching headers
    const cacheHeaders = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=7200, s-maxage=3600', // 2 hours client, 1 hour CDN
      'ETag': `"${Date.now()}"`,
      'Vary': 'Accept',
    };

    console.log(`Successfully proxied image: ${imageUrl.substring(0, 50)}... (${imageData.byteLength} bytes)`);

    return new Response(imageData, { headers: cacheHeaders });

  } catch (error) {
    console.error('Error in image-proxy function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});