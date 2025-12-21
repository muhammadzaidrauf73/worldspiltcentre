import { useRef, lazy, Suspense, memo, useMemo } from "react";
import { AirVent, Tv, WashingMachine, Refrigerator, Microwave, Flame, Droplets, ThermometerSun, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturesBar from "@/components/FeaturesBar";
import CategoryCard from "@/components/CategoryCard";
import ProductCarousel from "@/components/ProductCarousel";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { PullToRefresh } from "@/components/PullToRefresh";
import SEO from "@/components/SEO";

// Lazy load below-the-fold components for better TTI
const GradientBlob = lazy(() => import("@/components/effects/GradientBlob"));
const FlashDeal = lazy(() => import("@/components/FlashDeal"));
const NewArrivals = lazy(() => import("@/components/NewArrivals"));
const FeaturedBrands = lazy(() => import("@/components/FeaturedBrands"));
const TopSellers = lazy(() => import("@/components/TopSellers"));
const CustomerReviews = lazy(() => import("@/components/CustomerReviews"));
const Newsletter = lazy(() => import("@/components/Newsletter"));
const FAQ = lazy(() => import("@/components/FAQ"));
const Footer = lazy(() => import("@/components/Footer"));

// Lightweight loading placeholder
const SectionLoader = memo(() => (
  <div className="py-6 flex justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
  </div>
));
SectionLoader.displayName = "SectionLoader";

const iconMap: Record<string, LucideIcon> = {
  "AirVent": AirVent,
  "Tv": Tv,
  "WashingMachine": WashingMachine,
  "Refrigerator": Refrigerator,
  "Microwave": Microwave,
  "Flame": Flame,
  "Droplets": Droplets,
  "ThermometerSun": ThermometerSun,
};

interface HomepageSection {
  id: string;
  section_key: string;
  section_name: string;
  display_order: number;
  is_visible: boolean;
}

const Index = () => {
  const queryClient = useQueryClient();
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // Fetch homepage section settings
  const { data: sectionSettings = [] } = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as HomepageSection[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch categories from database with caching
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch featured products from database with caching
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 3 * 60 * 1000,
  });

  const featuredProducts = products.filter(p => p.is_featured).slice(0, 10);
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 10);
  
  // Get products by category - show up to 3 different categories
  const categoryProducts = categories
    .filter(cat => products.some(p => p.category_id === cat.id))
    .slice(0, 3)
    .map(category => ({
      category,
      products: products.filter(p => p.category_id === category.id).slice(0, 8)
    }))
    .filter(cp => cp.products.length >= 2);

  // Helper function to check if a section is visible
  const isSectionVisible = (sectionKey: string) => {
    const section = sectionSettings.find(s => s.section_key === sectionKey);
    return section ? section.is_visible : true;
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <SEO />
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Gradient Blobs for depth - lazy loaded */}
        <Suspense fallback={null}>
          <GradientBlob className="top-20 -left-32 opacity-30" color="primary" size="lg" />
          <GradientBlob className="top-[60vh] -right-20 opacity-20" color="accent" size="md" />
        </Suspense>
        
        <div className="relative z-10">
          <Navbar />
          <main>
            {/* 1. Hero Section */}
            {isSectionVisible("hero") && <Hero />}

            {/* 2. Features Bar - Above Categories */}
            {isSectionVisible("features") && <FeaturesBar />}

            {/* 3. Top Categories */}
            {isSectionVisible("categories") && (
              <section className="py-6 sm:py-8 bg-secondary/30" id="categories">
                <div className="container mx-auto px-4">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold gradient-text">
                        Top Categories
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Browse our wide range of electronics
                      </p>
                    </div>
                    <Link
                      to="/products"
                      className="text-primary text-xs sm:text-sm font-semibold hover:underline transition-smooth hidden sm:block"
                    >
                      View All →
                    </Link>
                  </div>

                  <div 
                    ref={categoriesScrollRef}
                    className="flex gap-2 sm:gap-3 md:gap-1 lg:gap-2 overflow-x-auto md:overflow-x-visible pb-4 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 md:flex-nowrap md:justify-between scrollbar-hide"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                  >
                    {categoriesLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="shrink-0 md:shrink">
                          <Skeleton className="w-16 h-16 sm:w-24 sm:h-24 rounded-full" />
                          <Skeleton className="w-16 sm:w-20 h-3 sm:h-4 mt-2 mx-auto" />
                        </div>
                      ))
                    ) : (
                      categories.map((category) => {
                        const actualProductCount = products.filter(p => p.category_id === category.id).length;
                        return (
                          <div key={category.id} className="shrink-0 md:shrink">
                            <CategoryCard
                              name={category.name}
                              icon={iconMap[category.icon || "Tv"] || Tv}
                              count={actualProductCount}
                              image={category.image_url || ""}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  <div className="flex justify-center mt-2 sm:hidden">
                    <Link
                      to="/products"
                      className="text-primary text-xs font-semibold hover:underline"
                    >
                      View All Categories →
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* 4. Flash Deals */}
            {isSectionVisible("flash_deals") && (
              <Suspense fallback={<SectionLoader />}>
                <FlashDeal />
              </Suspense>
            )}

            {/* 5. New Arrivals - Beside Flash Deals */}
            {isSectionVisible("new_arrivals") && (
              <Suspense fallback={<SectionLoader />}>
                <NewArrivals />
              </Suspense>
            )}

            {/* 6. Top Sellers */}
            {isSectionVisible("top_sellers") && (
              <Suspense fallback={<SectionLoader />}>
                <TopSellers />
              </Suspense>
            )}

            {/* Hot Deals - Featured Products */}
            {isSectionVisible("featured_products") && (
              <section className="py-5 sm:py-8 bg-card">
                <div className="container mx-auto px-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-5 gap-2 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-primary text-primary-foreground px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold">
                          Hot Deals
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-foreground">
                        Featured Products
                      </h2>
                    </div>
                    <Link
                      to="/products"
                      className="text-primary font-semibold hover:underline transition-smooth text-xs sm:text-sm"
                    >
                      View All →
                    </Link>
                  </div>

                  {productsLoading ? (
                    <ProductGridSkeleton count={4} />
                  ) : (
                    <ProductCarousel products={displayFeatured} />
                  )}
                </div>
              </section>
            )}

            {/* Category Product Sections */}
            {isSectionVisible("category_products") && categoryProducts.map((cp, idx) => (
              <section 
                key={cp.category.id} 
                className={`py-5 sm:py-8 ${idx % 2 === 0 ? 'bg-secondary/30' : 'bg-card'}`}
              >
                <div className="container mx-auto px-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-5 gap-2 sm:gap-4">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-foreground">
                      {cp.category.name}
                    </h2>
                    <Link
                      to={`/products?category=${encodeURIComponent(cp.category.name)}`}
                      className="text-primary font-semibold hover:underline transition-smooth text-xs sm:text-sm"
                    >
                      View All →
                    </Link>
                  </div>

                  <ProductCarousel products={cp.products} />
                </div>
              </section>
            ))}

            {/* Promo Banner */}
            {isSectionVisible("promo_banner") && (
              <section className="py-6 sm:py-8">
                <div className="container mx-auto px-4">
                  <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-card border border-border p-5 sm:p-8 md:p-10">
                    <div className="relative z-10 max-w-lg">
                      <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                        Limited Time Offer
                      </span>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground mb-2 sm:mb-3">
                        Best Price Guaranteed!
                      </h2>
                      <p className="text-muted-foreground mb-4 sm:mb-5 text-xs sm:text-sm md:text-base">
                        Found a lower price elsewhere? We'll match it! Shop with confidence at World Spilt Centre.
                      </p>
                      <Link to="/products">
                        <button className="bg-primary text-primary-foreground font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-primary/90 transition-smooth text-xs sm:text-sm">
                          Shop Now
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 7. Featured Brands - Above Footer */}
            {isSectionVisible("brands") && (
              <Suspense fallback={<SectionLoader />}>
                <FeaturedBrands />
              </Suspense>
            )}

            {/* 8. Customer Reviews - Above Footer */}
            {isSectionVisible("reviews") && (
              <Suspense fallback={<SectionLoader />}>
                <CustomerReviews />
              </Suspense>
            )}

            {/* 9. Newsletter - Above Footer */}
            {isSectionVisible("newsletter") && (
              <Suspense fallback={<SectionLoader />}>
                <Newsletter />
              </Suspense>
            )}

            {/* 10. FAQ - Just Above Footer */}
            {isSectionVisible("faq") && (
              <Suspense fallback={<SectionLoader />}>
                <FAQ />
              </Suspense>
            )}
          </main>
          
          {/* Footer */}
          <Suspense fallback={<SectionLoader />}>
            <Footer />
          </Suspense>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default Index;
