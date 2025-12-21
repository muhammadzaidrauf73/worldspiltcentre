import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductData {
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  description?: string;
  brand: string;
  category: string;
  sku?: string;
  specifications?: Record<string, string>;
  images: string[];
  source_url: string;
}

async function fetchPage(url: string): Promise<string> {
  console.log('Fetching page:', url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  return response.text();
}

function extractProductUrls(html: string): string[] {
  const urls: string[] = [];

  // Generic anchor href extraction (order-independent: class can come before/after href)
  const hrefPattern = /<a[^>]+href="(https?:\/\/(?:www\.)?lahorecentre\.com\/[^"?#]+\/?)"/gi;
  let match;
  while ((match = hrefPattern.exec(html)) !== null) {
    const raw = match[1];
    if (!raw) continue;

    // Normalize: ensure trailing slash for consistency
    const normalized = raw.endsWith('/') ? raw : `${raw}/`;

    // Skip obvious non-product URLs
    const lower = normalized.toLowerCase();
    if (
      lower.includes('/wp-content/') ||
      lower.includes('/wp-json/') ||
      lower.includes('/product-category/') ||
      lower.includes('/product-brand/') ||
      lower.includes('/my-account') ||
      lower.includes('/cart') ||
      lower.includes('/checkout') ||
      lower.includes('/installment') ||
      lower.includes('/blog') ||
      lower.includes('/write-for-us') ||
      lower.includes('/page/') ||
      lower.includes('add-to-cart')
    ) {
      continue;
    }

    // Exclude homepage / empty slugs
    const path = lower.replace(/^https?:\/\/(?:www\.)?lahorecentre\.com\//, '');
    if (!path || path === '/' || path.length < 2) continue;

    if (!urls.includes(normalized)) {
      urls.push(normalized);
    }
  }

  return urls;
}

function extractProductData(html: string, sourceUrl: string): ProductData | null {
  try {
    // Extract product name
    const nameMatch = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([^<]+)<\/h1>/i) 
      || html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const name = nameMatch ? nameMatch[1].trim() : '';
    
    if (!name) {
      console.log('Could not extract product name');
      return null;
    }

    // Extract price - look for the main product price
    const priceMatch = html.match(/₨([0-9,]+)/) || html.match(/Rs\.?\s*([0-9,]+)/);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;

    // Extract original price if on sale
    const originalPriceMatch = html.match(/<del[^>]*>.*?₨([0-9,]+).*?<\/del>/is);
    const originalPrice = originalPriceMatch ? parseInt(originalPriceMatch[1].replace(/,/g, '')) : undefined;

    // Extract description
    const descMatch = html.match(/<div[^>]*class="[^"]*woocommerce-product-details__short-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    let description = '';
    if (descMatch) {
      description = descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Extract brand
    const brandMatch = html.match(/Brands?:.*?<a[^>]*>([^<]+)<\/a>/i) 
      || html.match(/<td[^>]*>Brand<\/td>\s*<td[^>]*>([^<]+)<\/td>/i)
      || html.match(/\| Brand \| ([^|]+) \|/i);
    const brand = brandMatch ? brandMatch[1].trim() : 'Unknown';

    // Extract category
    const categoryMatch = html.match(/Categories?:.*?<a[^>]*>([^<]+)<\/a>/i);
    const category = categoryMatch ? categoryMatch[1].trim() : 'Air Fryer';

    // Extract SKU
    const skuMatch = html.match(/SKU:.*?([A-Za-z0-9-]+)/i);
    const sku = skuMatch ? skuMatch[1].trim() : undefined;

    // Extract images
    const images: string[] = [];
    
    // Main product gallery images (high resolution)
    const galleryPattern = /data-large_image="([^"]+)"/gi;
    let imgMatch;
    while ((imgMatch = galleryPattern.exec(html)) !== null) {
      const imgUrl = imgMatch[1];
      if (imgUrl && !images.includes(imgUrl) && imgUrl.includes('/uploads/')) {
        images.push(imgUrl);
      }
    }

    // WooCommerce product gallery image links
    const galleryHrefPattern = /woocommerce-product-gallery__image[^>]*>[\s\S]*?<a[^>]*href="([^"]+\.(jpg|jpeg|png|webp))"/gi;
    while ((imgMatch = galleryHrefPattern.exec(html)) !== null) {
      const imgUrl = imgMatch[1];
      if (imgUrl && !images.includes(imgUrl) && imgUrl.includes('/uploads/')) {
        images.push(imgUrl);
      }
    }

    // Also get main product image if not in gallery
    const mainImagePattern = /class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/gi;
    while ((imgMatch = mainImagePattern.exec(html)) !== null) {
      const imgUrl = imgMatch[1].replace(/-\d+x\d+\./, '.');
      if (imgUrl && !images.includes(imgUrl) && imgUrl.includes('/uploads/')) {
        images.push(imgUrl);
      }
    }

    // Extract specifications from the description
    const specifications: Record<string, string> = {};
    const specPatterns = [
      /(\d+)\s*(?:Watts?|W)\b/i,
      /(\d+(?:\.\d+)?)\s*(?:L|Liter|Litre|ltr)\b/i,
      /(\d+)\s*(?:kg|kilograms?)\b/i,
      /(\d+)\s*(?:°C|celsius|degrees?)\b/i,
    ];

    // Power
    const powerMatch = html.match(/(\d+)\s*(?:Watts?|W)\b/i);
    if (powerMatch) specifications['Power'] = `${powerMatch[1]}W`;

    // Capacity
    const capacityMatch = html.match(/(\d+(?:\.\d+)?)\s*(?:L|Liter|Litre|ltr)\b/i);
    if (capacityMatch) specifications['Capacity'] = `${capacityMatch[1]}L`;

    // Temperature
    const tempMatch = html.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:°C|celsius|degrees?)/i);
    if (tempMatch) {
      specifications['Temperature Range'] = tempMatch[2] ? `${tempMatch[1]}-${tempMatch[2]}°C` : `${tempMatch[1]}°C`;
    }

    // Timer
    const timerMatch = html.match(/(\d+)\s*(?:minutes?|mins?)/i);
    if (timerMatch) specifications['Timer'] = `${timerMatch[1]} minutes`;

    // Generate slug from URL
    const slugMatch = sourceUrl.match(/lahorecentre\.com\/([^\/]+)\/?$/);
    const slug = slugMatch ? slugMatch[1] : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    console.log(`Extracted product: ${name}, Price: ${price}, Images: ${images.length}`);

    return {
      name,
      slug,
      price,
      original_price: originalPrice,
      description,
      brand,
      category,
      sku,
      specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      images,
      source_url: sourceUrl,
    };
  } catch (error) {
    console.error('Error extracting product data:', error);
    return null;
  }
}

async function downloadImage(imageUrl: string, supabase: any, productSlug: string, index: number): Promise<string | null> {
  try {
    console.log(`Downloading image: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.lahorecentre.com/',
      },
    });

    if (!response.ok) {
      console.log(`Failed to download image: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('webp') ? 'webp' : 
                      contentType.includes('png') ? 'png' : 'jpg';
    
    const imageData = await response.arrayBuffer();
    const fileName = `air-fryers/${productSlug}-${index}.${extension}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageData, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.log(`Error uploading image: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    console.log(`Uploaded image: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, url, product } = body;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'list-products') {
      // Fetch listing page and extract product URLs
      const html = await fetchPage(url);

      const productUrlsFromPage = extractProductUrls(html).filter((u) => {
        // Filter out non-product URLs / noise
        const lower = u.toLowerCase();
        return (
          (lower.startsWith('https://www.lahorecentre.com/') || lower.startsWith('https://lahorecentre.com/')) &&
          !lower.includes('?') &&
          !lower.includes('#') &&
          !u.includes('/page/') &&
          !u.includes('/product-category/') &&
          !u.includes('/product-brand/') &&
          !u.includes('/my-account') &&
          !u.includes('/cart') &&
          !u.includes('/checkout') &&
          !u.includes('/shop') &&
          !u.includes('/installment')
        );
      });

      console.log(`Found ${productUrlsFromPage.length} product URLs`);

      return new Response(
        JSON.stringify({ success: true, productUrls: productUrlsFromPage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scrape-product') {
      // Scrape a single product
      const html = await fetchPage(url);
      const productData = extractProductData(html, url);

      if (!productData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Could not extract product data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Download images
      const uploadedImages: string[] = [];
      for (let i = 0; i < productData.images.length; i++) {
        const uploadedUrl = await downloadImage(productData.images[i], supabase, productData.slug, i);
        if (uploadedUrl) {
          uploadedImages.push(uploadedUrl);
        }
      }

      productData.images = uploadedImages;

      return new Response(
        JSON.stringify({ success: true, product: productData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import-product') {
      // Import product to database (product is already in the parsed body)
      if (!product) {
        return new Response(
          JSON.stringify({ success: false, error: 'No product data provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get or create category
      let categoryId = null;
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', product.category)
        .single();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const { data: newCategory } = await supabase
          .from('categories')
          .insert({
            name: product.category,
            slug: product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          })
          .select('id')
          .single();
        if (newCategory) categoryId = newCategory.id;
      }

      // Check if product already exists
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('slug', product.slug)
        .single();

      const productRecord = {
        name: product.name,
        slug: product.slug,
        price: product.price,
        original_price: product.original_price,
        description: product.description,
        brand: product.brand,
        category_id: categoryId,
        image_url: product.images[0] || null,
        gallery_images: product.images.slice(1),
        specifications: product.specifications,
        is_active: true,
        is_new_arrival: true,
        discount_percentage: product.original_price 
          ? Math.round((1 - product.price / product.original_price) * 100) 
          : null,
      };

      if (existingProduct) {
        await supabase
          .from('products')
          .update(productRecord)
          .eq('id', existingProduct.id);
      } else {
        await supabase
          .from('products')
          .insert(productRecord);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Product imported successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
