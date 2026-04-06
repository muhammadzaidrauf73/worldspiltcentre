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

interface ListedProduct {
  url: string;
  name: string;
  image: string;
  price: number;
  original_price?: number;
  specifications?: Record<string, string>;
}

// Known brands for auto-detection from product names
const KNOWN_BRANDS = [
  // Major appliance brands
  'Haier', 'Samsung', 'LG', 'Dawlance', 'Orient', 'Pel', 'Kenwood', 'Gree', 'TCL', 'Hisense',
  'Panasonic', 'Sony', 'Philips', 'Toshiba', 'Sharp', 'Hitachi', 'Electrolux', 'Whirlpool',
  // Pakistani/Regional brands
  'EcoStar', 'Ecostar', 'Super Asia', 'SuperAsia', 'Super General', 'Waves', 'Homage', 'National',
  'NasGas', 'Nasgas', 'Changhong Ruba', 'Changhong', 'Ruba', 'Enviro', 'Boss', 'Ikon', 'Geepas',
  // Kitchen appliances
  'Anex', 'Westpoint', 'West Point', 'Black & Decker', 'Black and Decker', 'Black Decker', 'Braun',
  'Moulinex', 'Tefal', 'Russell Hobbs', 'Oster', 'Hamilton Beach', 'Sunbeam', 'Cuisinart',
  'Nutribullet', 'Ninja', 'KitchenAid', 'Breville', 'Morphy Richards',
  // Air treatment
  'Gaba National', 'GabaNational', 'Inspire', 'IG', 'SG', 'GFC', 'PAK', 'Pak Fan', 'Royal',
  // Electronics
  'Audionic', 'JBL', 'Bose', 'Harman Kardon', 'Anker', 'Xiaomi', 'Huawei', 'Realme', 'Oppo',
  'Vivo', 'Infinix', 'Tecno', 'Itel', 'Nokia', 'Apple', 'Motorola', 'OnePlus', 'Redmi',
  // Water & Gas appliances
  'Canon', 'Nasgas', 'NasGas', 'InstaGas', 'Insta Gas', 'Super Gas', 'Super Flame',
  'i-Zone', 'iZone', 'i Zone', 'i-Max', 'iMax', 'i Max', 'Fotile', 'Robinhood',
  // TVs and displays
  'Multynet', 'Nobel', 'Akira', 'Panatron', 'Dany', 'Itel', 'Claas', 'Sasti',
  // Others
  'Okasha', 'Anko', 'Kelvinator', 'Midea', 'Carrier', 'Daikin', 'General', 'Nescafe', 'Nestle',
  'Delonghi', 'Saeco', 'Sage', 'Lavazza', 'Jura', 'Krups', 'Melitta', 'Siemens', 'Bosch',
  'Miele', 'AEG', 'Zanussi', 'Beko', 'Indesit', 'Hotpoint', 'Candy', 'Hoover', 'Dyson',
];

// Function to detect brand from product name
function detectBrandFromName(productName: string): string | null {
  const normalizedName = productName.toLowerCase();
  
  // Sort brands by length (longest first) to match more specific brands first
  // e.g., "Black & Decker" before "Black"
  const sortedBrands = [...KNOWN_BRANDS].sort((a, b) => b.length - a.length);
  
  for (const brand of sortedBrands) {
    const brandLower = brand.toLowerCase();
    
    // Check for exact word match to avoid partial matches
    // e.g., "Samsung" should match "Samsung TV" but not "Samsungabc"
    const patterns = [
      new RegExp(`^${brandLower}\\b`, 'i'),           // Brand at start
      new RegExp(`\\b${brandLower}\\b`, 'i'),         // Brand as whole word anywhere
      new RegExp(`^${brandLower.replace(/[- ]/g, '[-\\s]?')}\\b`, 'i'), // Handle variations
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(normalizedName)) {
        // Return the canonical brand name (properly capitalized)
        return brand;
      }
    }
  }
  
  // Special case handling for HTML entities and variations
  if (normalizedName.includes('black') && (normalizedName.includes('decker') || normalizedName.includes('&#038;'))) {
    return 'Black & Decker';
  }
  
  return null;
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

function extractProductsFromListing(html: string): ListedProduct[] {
  const products: ListedProduct[] = [];

  console.log('Parsing listing HTML, length:', html.length);

  // More flexible product pattern for various WooCommerce layouts
  // Look for product containers with common WooCommerce classes
  const productPatterns = [
    // Pattern 1: li.product elements (common WooCommerce layout)
    /<li[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
    // Pattern 2: section.product elements
    /<section[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
    // Pattern 3: div.product elements
    /<div[^>]*class="[^"]*product[^"]*type-product[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    // Pattern 4: article.product elements
    /<article[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
  ];

  for (const pattern of productPatterns) {
    let productMatch;
    while ((productMatch = pattern.exec(html)) !== null) {
      const productHtml = productMatch[0] + productMatch[1];
      
      // Extract product URL - look for links to product pages
      const urlPatterns = [
        /<a[^>]*href="(https?:\/\/[^"]*lahorecentre\.com\/[^"]*)"[^>]*class="[^"]*woocommerce-loop-product__link[^"]*"/i,
        /<a[^>]*class="[^"]*woocommerce-loop-product__link[^"]*"[^>]*href="(https?:\/\/[^"]+)"/i,
        /href="(https?:\/\/[^"]*lahorecentre\.com\/product\/[^"]+)"/i,
        /href="(https?:\/\/www\.lahorecentre\.com\/[a-zA-Z0-9][^"]*-[^"]+)"/i,
      ];
      
      let url = '';
      for (const urlPattern of urlPatterns) {
        const urlMatch = productHtml.match(urlPattern);
        if (urlMatch) {
          url = urlMatch[1];
          break;
        }
      }

      // Skip non-product URLs
      if (!url || 
          url.includes('/product-category/') || 
          url.includes('/product-brand/') || 
          url.includes('/cart') || 
          url.includes('/checkout') ||
          url.includes('/page/') ||
          url.includes('add-to-cart') ||
          url.includes('.jpg') ||
          url.includes('.png') ||
          url.includes('.webp')) {
        continue;
      }

      // Extract product name
      const namePatterns = [
        /<h2[^>]*class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>([^<]+)<\/h2>/i,
        /<h2[^>]*>([^<]+)<\/h2>/i,
        /<span[^>]*class="[^"]*product-name[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i,
        /<a[^>]*href="[^"]*"[^>]*title="([^"]+)"/i,
        /<a[^>]*title="([^"]+)"[^>]*href="[^"]*"/i,
      ];
      
      let name = '';
      for (const namePattern of namePatterns) {
        const nameMatch = productHtml.match(namePattern);
        if (nameMatch) {
          name = nameMatch[1].trim();
          break;
        }
      }

      if (!name) continue;

      // Extract product image
      const imagePatterns = [
        /src="([^"]+)"[^>]*class="[^"]*attachment-woocommerce[^"]*"/i,
        /class="[^"]*attachment-woocommerce[^"]*"[^>]*src="([^"]+)"/i,
        /<img[^>]*src="(https?:\/\/[^"]+\/uploads\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
        /<img[^>]*data-src="(https?:\/\/[^"]+\/uploads\/[^"]+)"/i,
        /data-large_image="([^"]+)"/i,
      ];
      
      let image = '';
      for (const imagePattern of imagePatterns) {
        const imageMatch = productHtml.match(imagePattern);
        if (imageMatch) {
          image = imageMatch[1];
          break;
        }
      }
      
      // Convert thumbnail to full size image
      if (image) {
        image = image.replace(/-\d+x\d+\./, '.');
      }

      // Extract current price - LahoreCentre format: <bdi><span class="...currencySymbol">₨</span>49,900</bdi>
      const pricePatterns = [
        // Sale price in <ins> tag (current discounted price)
        /<ins[^>]*>[\s\S]*?<bdi>[\s\S]*?<\/span>([0-9,]+)/i,
        // Standard WooCommerce price with currency symbol in span
        /<span[^>]*class="[^"]*woocommerce-Price-amount[^"]*"[^>]*>[\s\S]*?<bdi>[\s\S]*?<\/span>([0-9,]+)/i,
        // Price after currency symbol span
        /woocommerce-Price-currencySymbol[^>]*>₨<\/span>([0-9,]+)/i,
        // Direct currency patterns
        /₨<\/span>([0-9,]+)/i,
        /₨\s*([0-9,]+(?:\.[0-9]+)?)/i,
        /Rs\.?\s*([0-9,]+)/i,
      ];
      
      let price = 0;
      for (const pricePattern of pricePatterns) {
        const priceMatch = productHtml.match(pricePattern);
        if (priceMatch) {
          price = parseInt(priceMatch[1].replace(/,/g, ''));
          if (price > 0) break; // Only break if we got a valid price
        }
      }

      // Extract original price (for sale items) - in <del> tag
      const originalPricePatterns = [
        /<del[^>]*>[\s\S]*?<\/span>([0-9,]+)[\s\S]*?<\/del>/i,
        /<del[^>]*>[\s\S]*?₨[\s\S]*?([0-9,]+)[\s\S]*?<\/del>/i,
      ];
      let originalPrice: number | undefined;
      for (const origPricePattern of originalPricePatterns) {
        const originalPriceMatch = productHtml.match(origPricePattern);
        if (originalPriceMatch) {
          originalPrice = parseInt(originalPriceMatch[1].replace(/,/g, ''));
          if (originalPrice > 0) break;
        }
      }

      // Check for duplicates
      if (!products.some(p => p.url === url)) {
        products.push({ 
          url, 
          name, 
          image, 
          price,
          original_price: originalPrice 
        });
        console.log(`Found product: ${name}, Price: ${price}, Image: ${image ? 'yes' : 'no'}`);
      }
    }
  }

  // If no products found with patterns, try a more aggressive search
  if (products.length === 0) {
    console.log('No products found with standard patterns, trying aggressive search...');
    
    // Look for all links that look like product URLs
    const linkPattern = /<a[^>]*href="(https?:\/\/www\.lahorecentre\.com\/[a-zA-Z0-9][a-zA-Z0-9-]+\/)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<\/a>/gi;
    let linkMatch;
    
    while ((linkMatch = linkPattern.exec(html)) !== null) {
      const url = linkMatch[1];
      let image = linkMatch[2];
      
      // Skip category/brand pages
      if (url.includes('/product-category/') || 
          url.includes('/product-brand/') ||
          url.includes('/page/')) {
        continue;
      }
      
      // Get name from URL
      const slugMatch = url.match(/lahorecentre\.com\/([^\/]+)\/?$/);
      const name = slugMatch ? slugMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
      
      if (name && !products.some(p => p.url === url)) {
        image = image.replace(/-\d+x\d+\./, '.');
        products.push({ url, name, image, price: 0 });
        console.log(`Found product (aggressive): ${name}`);
      }
    }
  }

  console.log(`Extracted ${products.length} products from listing`);
  return products;
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

    // Extract price - LahoreCentre format: <bdi><span class="...currencySymbol">₨</span>49,900</bdi>
    const pricePatterns = [
      // Sale price in <ins> tag (current discounted price)
      /<ins[^>]*>[\s\S]*?<bdi>[\s\S]*?<\/span>([0-9,]+)/i,
      // Standard WooCommerce price with currency symbol in span
      /<span[^>]*class="[^"]*woocommerce-Price-amount[^"]*"[^>]*>[\s\S]*?<bdi>[\s\S]*?<\/span>([0-9,]+)/i,
      // Price after currency symbol span
      /woocommerce-Price-currencySymbol[^>]*>₨<\/span>([0-9,]+)/i,
      // Direct currency patterns
      /₨<\/span>([0-9,]+)/i,
      /<p[^>]*class="[^"]*price[^"]*"[^>]*>[\s\S]*?₨[\s\S]*?([0-9,]+)/i,
      /₨\s*([0-9,]+(?:\.[0-9]+)?)/i,
      /Rs\.?\s*([0-9,]+)/i,
    ];
    
    let price = 0;
    for (const pricePattern of pricePatterns) {
      const priceMatch = html.match(pricePattern);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ''));
        if (price > 0) {
          console.log(`Extracted price: ${price} using pattern: ${pricePattern.source.substring(0, 50)}...`);
          break;
        }
      }
    }

    // Extract original price if on sale - in <del> tag
    const originalPricePatterns = [
      /<del[^>]*>[\s\S]*?<\/span>([0-9,]+)[\s\S]*?<\/del>/i,
      /<del[^>]*>[\s\S]*?₨[\s\S]*?([0-9,]+)[\s\S]*?<\/del>/i,
    ];
    let originalPrice: number | undefined;
    for (const origPricePattern of originalPricePatterns) {
      const originalPriceMatch = html.match(origPricePattern);
      if (originalPriceMatch) {
        originalPrice = parseInt(originalPriceMatch[1].replace(/,/g, ''));
        if (originalPrice > 0) break;
      }
    }

    // Extract description - try multiple patterns
    let description = '';
    
    // WooCommerce short description
    const shortDescMatch = html.match(/<div[^>]*class="[^"]*woocommerce-product-details__short-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (shortDescMatch) {
      description = shortDescMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    // If no short description, try product description tab
    if (!description) {
      const descTabMatch = html.match(/<div[^>]*id="tab-description"[^>]*>([\s\S]*?)<\/div>/i);
      if (descTabMatch) {
        description = descTabMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 1000);
      }
    }

    // Also try to get description from meta
    if (!description) {
      const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
      if (metaDescMatch) {
        description = metaDescMatch[1].trim();
      }
    }

    // Extract brand from HTML first
    const brandMatch = html.match(/Brands?:.*?<a[^>]*>([^<]+)<\/a>/i) 
      || html.match(/<td[^>]*>Brand<\/td>\s*<td[^>]*>([^<]+)<\/td>/i)
      || html.match(/product_brand-([a-z0-9-]+)/i)
      || html.match(/\| Brand \| ([^|]+) \|/i);
    let brand = brandMatch ? brandMatch[1].trim() : '';
    
    // Clean up brand name if it's a slug
    if (brand) {
      brand = brand.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    
    // If brand is still empty or "Unknown", try to detect from product name
    if (!brand || brand.toLowerCase() === 'unknown') {
      const detectedBrand = detectBrandFromName(name);
      if (detectedBrand) {
        brand = detectedBrand;
        console.log(`Auto-detected brand "${brand}" from product name: ${name}`);
      } else {
        brand = 'Unknown';
      }
    }

    // Extract category
    const categoryMatch = html.match(/Categories?:.*?<a[^>]*>([^<]+)<\/a>/i)
      || html.match(/product_cat-([a-z0-9-]+)/i);
    let category = categoryMatch ? categoryMatch[1].trim() : 'General';
    category = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Extract SKU
    const skuMatch = html.match(/SKU:.*?([A-Za-z0-9-]+)/i) 
      || html.match(/data-product_sku="([^"]+)"/i);
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

    // Extract specifications from tables and description
    const specifications: Record<string, string> = {};
    
    // Try to extract from specification tables - multiple patterns
    const specPatterns = [
      /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi,
      /<tr[^>]*>\s*<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi,
    ];
    
    for (const specPattern of specPatterns) {
      while ((imgMatch = specPattern.exec(html)) !== null) {
        const key = imgMatch[1].replace(/<[^>]+>/g, '').trim();
        const value = imgMatch[2].replace(/<[^>]+>/g, '').trim();
        if (key && value && key.length < 50 && value.length < 200 && !specifications[key]) {
          specifications[key] = value;
        }
      }
    }

    // Power
    const powerMatch = html.match(/(\d+)\s*(?:Watts?|W)\b/i);
    if (powerMatch && !specifications['Power']) specifications['Power'] = `${powerMatch[1]}W`;

    // Capacity
    const capacityMatch = html.match(/(\d+(?:\.\d+)?)\s*(?:L|Liter|Litre|ltr)\b/i);
    if (capacityMatch && !specifications['Capacity']) specifications['Capacity'] = `${capacityMatch[1]}L`;

    // Temperature
    const tempMatch = html.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:°C|celsius|degrees?)/i);
    if (tempMatch && !specifications['Temperature Range']) {
      specifications['Temperature Range'] = tempMatch[2] ? `${tempMatch[1]}-${tempMatch[2]}°C` : `${tempMatch[1]}°C`;
    }

    // Timer
    const timerMatch = html.match(/(\d+)\s*(?:minutes?|mins?)/i);
    if (timerMatch && !specifications['Timer']) specifications['Timer'] = `${timerMatch[1]} minutes`;

    // Generate slug from URL
    const slugMatch = sourceUrl.match(/lahorecentre\.com\/([^\/]+)\/?$/);
    const slug = slugMatch ? slugMatch[1] : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    console.log(`Extracted product: ${name}, Price: ${price}, Images: ${images.length}, Specs: ${Object.keys(specifications).length}`);

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
    const fileName = `products/${productSlug}-${index}.${extension}`;

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

// Download all images in parallel for faster processing
async function downloadImagesParallel(images: string[], supabase: any, productSlug: string): Promise<string[]> {
  const promises = images.map((img, idx) => downloadImage(img, supabase, productSlug, idx));
  const results = await Promise.all(promises);
  return results.filter((url): url is string => url !== null);
}

// Faster fetch with timeout
async function fetchPageFast(url: string, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Failed: ${response.status}`);
    return response.text();
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

// Download only the first image (faster), queue rest for background
async function downloadFirstImage(images: string[], supabase: any, productSlug: string): Promise<string[]> {
  if (images.length === 0) return [];
  
  // Download first image only for immediate use
  const firstImage = await downloadImage(images[0], supabase, productSlug, 0);
  const uploadedImages = firstImage ? [firstImage] : [];
  
  // Download remaining images in parallel but don't wait for them
  if (images.length > 1) {
    const remainingImages = images.slice(1);
    // Fire and forget - don't await
    Promise.all(
      remainingImages.map((img, idx) => 
        downloadImage(img, supabase, productSlug, idx + 1)
      )
    ).then(async results => {
      const validUrls = results.filter((url): url is string => url !== null);
      if (validUrls.length > 0) {
        // Update product with additional images
        await supabase
          .from('products')
          .update({ gallery_images: validUrls })
          .eq('slug', productSlug);
        console.log(`Updated gallery for ${productSlug} with ${validUrls.length} images`);
      }
    }).catch(err => console.error('Background image download error:', err));
  }
  
  return uploadedImages;
}

// Category cache for batch operations
const categoryCache = new Map<string, string | null>();

async function getOrCreateCategoryFast(supabase: any, categoryName: string): Promise<string | null> {
  if (!categoryName) return null;
  
  // Check cache first
  if (categoryCache.has(categoryName)) {
    return categoryCache.get(categoryName) || null;
  }
  
  const { data: existingCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .maybeSingle();

  if (existingCategory) {
    categoryCache.set(categoryName, existingCategory.id);
    return existingCategory.id;
  }
  
  const { data: newCategory } = await supabase
    .from('categories')
    .insert({
      name: categoryName,
      slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    })
    .select('id')
    .single();
    
  const categoryId = newCategory?.id || null;
  categoryCache.set(categoryName, categoryId);
  return categoryId;
}

// Process a single product for batch import (optimized)
async function processProductForBatchFast(
  url: string,
  supabase: any,
  categoryOverride?: string,
  priceMarkup?: number,
  skipGallery = false,
  stockQuantity?: number
): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    const html = await fetchPageFast(url);
    const productData = extractProductData(html, url);

    if (!productData) {
      return { success: false, error: 'Could not extract product data' };
    }

    // Download only first image for speed (gallery downloads in background)
    const uploadedImages = skipGallery 
      ? await downloadFirstImage(productData.images, supabase, productData.slug)
      : await downloadImagesParallel(productData.images, supabase, productData.slug);
    
    productData.images = uploadedImages;

    // Use cached category lookup
    const categoryName = categoryOverride || productData.category;
    const categoryId = await getOrCreateCategoryFast(supabase, categoryName);

    // Check if product already exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', productData.slug)
      .maybeSingle();

    // Apply price markup if specified
    const markupMultiplier = priceMarkup ? 1 + (priceMarkup / 100) : 1;
    const finalPrice = Math.round(productData.price * markupMultiplier);
    const finalOriginalPrice = productData.original_price 
      ? Math.round(productData.original_price * markupMultiplier) 
      : null;

    const productRecord = {
      name: productData.name,
      slug: productData.slug,
      price: finalPrice,
      original_price: finalOriginalPrice,
      description: productData.description,
      brand: productData.brand,
      category_id: categoryId,
      image_url: productData.images[0] || null,
      gallery_images: productData.images.slice(1),
      specifications: productData.specifications,
      is_active: true,
      is_new_arrival: true,
      stock_quantity: stockQuantity ?? 10,
      discount_percentage: finalOriginalPrice 
        ? Math.round((1 - finalPrice / finalOriginalPrice) * 100) 
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

    return { success: true, name: productData.name };
  } catch (error) {
    console.error(`Error processing ${url}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Legacy function for backwards compatibility
async function processProductForBatch(
  url: string,
  supabase: any,
  categoryOverride?: string,
  priceMarkup?: number,
  stockQuantity?: number
): Promise<{ success: boolean; name?: string; error?: string }> {
  return processProductForBatchFast(url, supabase, categoryOverride, priceMarkup, false, stockQuantity);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, url, product, categoryOverride, priceMarkup, stockQuantity } = body;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'list-products') {
      // Fetch listing page and extract products with name, image, price
      const html = await fetchPage(url);
      const listedProducts = extractProductsFromListing(html);

      return new Response(
        JSON.stringify({ success: true, products: listedProducts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scrape-product') {
      // Scrape a single product's full details
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
        .maybeSingle();

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
        .maybeSingle();

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
        stock_quantity: stockQuantity ?? 10,
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

    // Quick import - scrape and import in one step
    if (action === 'quick-import') {
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

      // Use category override if provided
      const categoryName = categoryOverride || productData.category;

      // Get or create category
      let categoryId = null;
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .maybeSingle();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else if (categoryName) {
        const { data: newCategory } = await supabase
          .from('categories')
          .insert({
            name: categoryName,
            slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          })
          .select('id')
          .single();
        if (newCategory) categoryId = newCategory.id;
      }

      // Check if product already exists
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productData.slug)
        .maybeSingle();

      // Apply price markup if specified
      const markupMultiplier = priceMarkup ? 1 + (priceMarkup / 100) : 1;
      const finalPrice = Math.round(productData.price * markupMultiplier);
      const finalOriginalPrice = productData.original_price 
        ? Math.round(productData.original_price * markupMultiplier) 
        : null;

      console.log(`Price: ${productData.price} -> ${finalPrice} (markup: ${priceMarkup || 0}%)`);

      const productRecord = {
        name: productData.name,
        slug: productData.slug,
        price: finalPrice,
        original_price: finalOriginalPrice,
        description: productData.description,
        brand: productData.brand,
        category_id: categoryId,
        image_url: productData.images[0] || null,
        gallery_images: productData.images.slice(1),
        specifications: productData.specifications,
        is_active: true,
        is_new_arrival: true,
        stock_quantity: stockQuantity ?? 10,
        discount_percentage: finalOriginalPrice 
          ? Math.round((1 - finalPrice / finalOriginalPrice) * 100) 
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
        JSON.stringify({ success: true, product: productData, message: 'Product imported successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch import - process multiple products in parallel for speed
    if (action === 'batch-import') {
      const { urls, categoryOverride, priceMarkup, stockQuantity, concurrency = 5, turboMode = false } = body;
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'No URLs provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Clear category cache at start of batch
      categoryCache.clear();

      // Ultra-fast: process up to 24 products concurrently for maximum speed
      const effectiveConcurrency = turboMode ? Math.min(concurrency, 24) : Math.min(concurrency, 12);
      console.log(`Batch importing ${urls.length} products with concurrency ${effectiveConcurrency} (turbo: ${turboMode})`);
      
      const results: { url: string; success: boolean; name?: string; error?: string }[] = [];
      
      // Process all URLs in parallel batches
      for (let i = 0; i < urls.length; i += effectiveConcurrency) {
        const batch = urls.slice(i, i + effectiveConcurrency);
        const batchPromises = batch.map((url: string) => 
          processProductForBatchFast(url, supabase, categoryOverride, priceMarkup, turboMode)
            .then(result => ({ url, ...result }))
            .catch(error => ({ url, success: false, error: error.message }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        console.log(`Processed batch ${Math.floor(i / effectiveConcurrency) + 1}, total: ${results.length}/${urls.length}`);
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      return new Response(
        JSON.stringify({ 
          success: true, 
          results,
          summary: { total: urls.length, success: successCount, errors: errorCount }
        }),
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
