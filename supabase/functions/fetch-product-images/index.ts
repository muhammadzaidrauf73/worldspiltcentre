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
    console.log('Page fetched, extracting images...');

    // Extract image URLs from the page
    const images: string[] = [];

    // Pattern 1: WooCommerce product gallery images (data-large_image or data-src)
    const wooGalleryPattern = /data-large_image="([^"]+)"/g;
    let match;
    while ((match = wooGalleryPattern.exec(html)) !== null) {
      if (match[1] && !images.includes(match[1])) {
        images.push(match[1]);
      }
    }

    // Pattern 2: WooCommerce main product image
    const mainImagePattern = /woocommerce-product-gallery__image[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"/g;
    while ((match = mainImagePattern.exec(html)) !== null) {
      if (match[1] && !images.includes(match[1])) {
        images.push(match[1]);
      }
    }

    // Pattern 3: Product thumbnails
    const thumbnailPattern = /data-thumb="([^"]+)"/g;
    while ((match = thumbnailPattern.exec(html)) !== null) {
      if (match[1] && !images.includes(match[1])) {
        // Convert thumbnail to full size by removing size suffix
        const fullSizeUrl = match[1].replace(/-\d+x\d+\./, '.');
        if (!images.includes(fullSizeUrl)) {
          images.push(fullSizeUrl);
        }
      }
    }

    // Pattern 4: Direct image URLs in src attributes for product images
    const imgSrcPattern = /<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/g;
    while ((match = imgSrcPattern.exec(html)) !== null) {
      if (match[1] && !images.includes(match[1])) {
        // Convert to full size
        const fullSizeUrl = match[1].replace(/-\d+x\d+\./, '.');
        if (!images.includes(fullSizeUrl)) {
          images.push(fullSizeUrl);
        }
      }
    }

    // Pattern 5: srcset for higher resolution images
    const srcsetPattern = /srcset="([^"]+)"/g;
    while ((match = srcsetPattern.exec(html)) !== null) {
      const srcset = match[1];
      // Get the largest image from srcset
      const srcsetParts = srcset.split(',').map(s => s.trim());
      for (const part of srcsetParts) {
        const [imgUrl] = part.split(' ');
        if (imgUrl && imgUrl.includes('lahorecentre.com') && imgUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
          // Convert to full size
          const fullSizeUrl = imgUrl.replace(/-\d+x\d+\./, '.');
          if (!images.includes(fullSizeUrl)) {
            images.push(fullSizeUrl);
          }
        }
      }
    }

    // Pattern 6: General product images from wp-content/uploads
    const generalPattern = /https?:\/\/www\.lahorecentre\.com\/wp-content\/uploads\/[^"'\s)]+\.(jpg|jpeg|png|webp)/gi;
    while ((match = generalPattern.exec(html)) !== null) {
      let imgUrl = match[0];
      // Convert to full size by removing dimensions
      const fullSizeUrl = imgUrl.replace(/-\d+x\d+\./, '.');
      if (!images.includes(fullSizeUrl)) {
        images.push(fullSizeUrl);
      }
    }

    // Remove duplicates and filter valid images
    const uniqueImages = [...new Set(images)].filter(img => 
      img.startsWith('http') && 
      !img.includes('placeholder') &&
      !img.includes('logo') &&
      !img.includes('icon')
    );

    console.log(`Found ${uniqueImages.length} unique images`);

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
