import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

const SITE_URL = 'https://worldspiltcentre.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating dynamic sitemap...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    // Fetch all published blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (blogError) {
      console.error('Error fetching blog posts:', blogError);
      throw blogError;
    }

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('slug, created_at')
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    }

    const today = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
      { loc: '/', changefreq: 'daily', priority: '1.0', lastmod: today },
      { loc: '/products', changefreq: 'daily', priority: '0.9', lastmod: today },
      { loc: '/about', changefreq: 'monthly', priority: '0.8', lastmod: today },
      { loc: '/contact', changefreq: 'monthly', priority: '0.8', lastmod: today },
      { loc: '/store-locations', changefreq: 'monthly', priority: '0.8', lastmod: today },
      { loc: '/blog', changefreq: 'weekly', priority: '0.7', lastmod: today },
      { loc: '/shipping', changefreq: 'monthly', priority: '0.6', lastmod: today },
      { loc: '/returns', changefreq: 'monthly', priority: '0.6', lastmod: today },
      { loc: '/refund-policy', changefreq: 'monthly', priority: '0.6', lastmod: today },
      { loc: '/warranty', changefreq: 'monthly', priority: '0.6', lastmod: today },
      { loc: '/order-tracking', changefreq: 'monthly', priority: '0.5', lastmod: today },
      { loc: '/careers', changefreq: 'monthly', priority: '0.5', lastmod: today },
      { loc: '/privacy', changefreq: 'yearly', priority: '0.3', lastmod: today },
      { loc: '/terms', changefreq: 'yearly', priority: '0.3', lastmod: today },
    ];

    // Generate XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add category pages
    if (categories && categories.length > 0) {
      for (const category of categories) {
        const lastmod = category.created_at ? new Date(category.created_at).toISOString().split('T')[0] : today;
        xml += `  <url>
    <loc>${SITE_URL}/products?category=${encodeURIComponent(category.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Add product pages
    if (products && products.length > 0) {
      console.log(`Adding ${products.length} product URLs to sitemap`);
      for (const product of products) {
        const lastmod = product.updated_at ? new Date(product.updated_at).toISOString().split('T')[0] : today;
        xml += `  <url>
    <loc>${SITE_URL}/product/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add blog post pages
    if (blogPosts && blogPosts.length > 0) {
      console.log(`Adding ${blogPosts.length} blog post URLs to sitemap`);
      for (const post of blogPosts) {
        const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : today;
        xml += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    const totalUrls = staticPages.length + (products?.length || 0) + (blogPosts?.length || 0) + (categories?.length || 0);
    console.log(`Sitemap generated successfully with ${totalUrls} URLs`);

    return new Response(xml, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating sitemap:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap', details: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
