import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    console.log('Page fetched, length:', html.length);

    const images: string[] = [];
    let match;

    // Pattern 1: WooCommerce product gallery - data-large_image (highest quality)
    const wooGalleryPattern = /data-large_image="([^"]+)"/g;
    while ((match = wooGalleryPattern.exec(html)) !== null) {
      if (match[1]) images.push(match[1]);
    }

    // Pattern 2: data-src attributes (lazy loaded images) - single URL only
    const dataSrcPattern = /data-src="(https?:\/\/[^"\s]+\.(jpg|jpeg|png|webp))"/gi;
    while ((match = dataSrcPattern.exec(html)) !== null) {
      if (match[1]) images.push(match[1]);
    }

    // Pattern 3: data-zoom-image or data-full attributes
    const dataZoomPattern = /data-(?:zoom-image|full|image)="(https?:\/\/[^"\s]+\.(jpg|jpeg|png|webp))"/gi;
    while ((match = dataZoomPattern.exec(html)) !== null) {
      if (match[1]) images.push(match[1]);
    }

    // Pattern 4: Standard img src - only from product content areas
    const imgSrcPattern = /<img[^>]+src="(https?:\/\/[^"\s]+\.(jpg|jpeg|png|webp))"/gi;
    while ((match = imgSrcPattern.exec(html)) !== null) {
      if (match[1]) images.push(match[1]);
    }

    // Pattern 5: Gallery href links to full-size images
    const hrefImagePattern = /<a[^>]+href="(https?:\/\/[^"\s]+\.(jpg|jpeg|png|webp))"/gi;
    while ((match = hrefImagePattern.exec(html)) !== null) {
      if (match[1]) images.push(match[1]);
    }

    // Make relative URLs absolute
    const baseUrl = new URL(url);
    const absoluteImages = images.map(img => {
      if (img.startsWith('//')) return `https:${img}`;
      if (img.startsWith('/')) return `${baseUrl.origin}${img}`;
      if (!img.startsWith('http')) return `${baseUrl.origin}/${img}`;
      return img;
    });

    // Filter: keep only product-relevant images
    const excludeTerms = [
      'placeholder', 'logo', 'icon', 'favicon', 'avatar', 'payment',
      'badge', 'sprite', 'blank', 'pixel', 'tracking', 'analytics',
      'social', 'mastercard', 'visa', 'cod-', 'bank-transfer',
      'whatsapp', 'facebook', 'twitter', 'instagram', 'youtube',
      'calculator', 'our-branches', 'home-page-small', 'footer',
      'header', 'menu', 'widget', 'sidebar', 'woocommerce-placeholder'
    ];

    const uniqueImages = [...new Set(absoluteImages)].filter(img => {
      if (!img.startsWith('http')) return false;
      const lower = img.toLowerCase();
      // Exclude tiny images (50x50, 46x46 etc - likely thumbnails/icons)
      if (/[-_]\d{1,2}x\d{1,2}\./i.test(img)) return false;
      // Exclude non-product paths
      for (const term of excludeTerms) {
        if (lower.includes(term)) return false;
      }
      // Must have valid image extension
      if (!/\.(jpg|jpeg|png|webp)$/i.test(img)) return false;
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
