import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching images from:', url);

    // Fetch the page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    console.log('Page fetched, extracting product images...');

    const images: string[] = [];

    // Pattern 1: WooCommerce product gallery - data-large_image (primary product images)
    const wooGalleryPattern = /woocommerce-product-gallery__image[^>]*data-large_image="([^"]+)"/g;
    let match;
    while ((match = wooGalleryPattern.exec(html)) !== null) {
      if (match[1] && !images.includes(match[1])) {
        images.push(match[1]);
      }
    }

    // Pattern 2: data-large_image attribute (product gallery images)
    const largeImagePattern = /data-large_image="([^"]+)"/g;
    while ((match = largeImagePattern.exec(html)) !== null) {
      const imgUrl = match[1];
      if (imgUrl && !images.includes(imgUrl) && imgUrl.includes('/uploads/')) {
        images.push(imgUrl);
      }
    }

    // Pattern 3: Product gallery href links
    const galleryHrefPattern = /woocommerce-product-gallery__image[^>]*>[\s\S]*?<a[^>]*href="([^"]+\.(jpg|jpeg|png|webp))"/gi;
    while ((match = galleryHrefPattern.exec(html)) !== null) {
      if (match[1] && !images.includes(match[1])) {
        images.push(match[1]);
      }
    }

    // Remove duplicates and filter to only product images
    const uniqueImages = [...new Set(images)].filter(img => {
      // Must be a valid URL
      if (!img.startsWith('http')) return false;
      // Must be from uploads folder (product images)
      if (!img.includes('/uploads/')) return false;
      // Exclude common non-product images
      if (img.includes('placeholder')) return false;
      if (img.includes('logo')) return false;
      if (img.includes('icon')) return false;
      if (img.includes('banner')) return false;
      if (img.includes('favicon')) return false;
      return true;
    });

    console.log(`Found ${uniqueImages.length} product images`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: uniqueImages,
        count: uniqueImages.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error fetching images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch images';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
