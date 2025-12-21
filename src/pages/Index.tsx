import { useRef, lazy, Suspense, memo } from "react";
import { AirVent, Tv, WashingMachine, Refrigerator, Microwave, Flame, Droplets, ThermometerSun, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturesBar from "@/components/FeaturesBar";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/PullToRefresh";
import SEO from "@/components/SEO";

// Lazy load below-the-fold components for better TTI
const ScrollReveal = lazy(() => import("@/components/effects/ScrollReveal"));
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

const Index = () => {
  const queryClient = useQueryClient();
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
  });

  const featuredProducts = products.filter(p => p.is_featured).slice(0, 8);
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);
  
  // Get washing machines
  const washingMachineCategory = categories.find(c => c.name === "Washing Machines");
  const washingMachines = washingMachineCategory 
    ? products.filter(p => p.category_id === washingMachineCategory.id).slice(0, 4)
    : [];

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
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
            <Hero />
          <FeaturesBar />

          {/* Top Categories */}
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

              {/* Horizontal Scroll Container - Touch scroll on mobile */}
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
              
              {/* Mobile View All Link */}
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

          <Suspense fallback={<SectionLoader />}>
            <FlashDeal />
          </Suspense>

          {/* Hot Deals - Featured Products */}
          <section className="py-8 sm:py-10 bg-card">
            <div className="container mx-auto px-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
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
                <ProductGridSkeleton count={8} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {displayFeatured.map((product, index) => (
                    <Link key={product.id} to={`/product/${product.id}`}>
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        brand={product.brand}
                        price={Number(product.price)}
                        originalPrice={product.original_price ? Number(product.original_price) : undefined}
                        image={product.image_url || ""}
                        rating={Number(product.rating) || 0}
                        reviews={product.reviews_count || 0}
                        badge={product.discount_percentage ? `${product.discount_percentage}% OFF` : undefined}
                        index={index}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Washing Machines Section */}
          {washingMachines.length > 0 && (
            <section className="py-8 sm:py-10 bg-secondary/30">
              <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-foreground">
                    Washing Machines
                  </h2>
                  <Link
                    to="/products?category=Washing%20Machines"
                    className="text-primary font-semibold hover:underline transition-smooth text-xs sm:text-sm"
                  >
                    View All →
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {washingMachines.map((product, index) => (
                    <Link key={product.id} to={`/product/${product.id}`}>
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        brand={product.brand}
                        price={Number(product.price)}
                        originalPrice={product.original_price ? Number(product.original_price) : undefined}
                        image={product.image_url || ""}
                        rating={Number(product.rating) || 0}
                        reviews={product.reviews_count || 0}
                        badge={product.discount_percentage ? `${product.discount_percentage}% OFF` : undefined}
                        index={index}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Promo Banner */}
          <section className="py-6 sm:py-8">
            <div className="container mx-auto px-4">
              <div className="relative overflow-hidden rounded-lg sm:rounded-xl gradient-hero p-5 sm:p-8 md:p-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
                <div className="relative z-10 max-w-lg">
                  <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded bg-primary-foreground/20 text-primary-foreground text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                    Limited Time Offer
                  </span>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-primary-foreground mb-2 sm:mb-3">
                    Best Price Guaranteed!
                  </h2>
                  <p className="text-primary-foreground/80 mb-4 sm:mb-5 text-xs sm:text-sm md:text-base">
                    Found a lower price elsewhere? We'll match it! Shop with confidence at World Spilt Centre.
                  </p>
                  <Link to="/products">
                    <button className="bg-primary-foreground text-primary font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-primary-foreground/90 transition-smooth text-xs sm:text-sm">
                      Shop Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <Suspense fallback={<SectionLoader />}>
            <NewArrivals />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <FeaturedBrands />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <TopSellers />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <CustomerReviews />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <Newsletter />
          </Suspense>
          <Suspense fallback={<SectionLoader />}>
            <FAQ />
          </Suspense>
          </main>
          <Suspense fallback={<SectionLoader />}>
            <Footer />
          </Suspense>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default Index;
