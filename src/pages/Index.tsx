import { AirVent, Tv, WashingMachine, Refrigerator, Microwave, Flame, Droplets, ThermometerSun, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturesBar from "@/components/FeaturesBar";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import CustomerReviews from "@/components/CustomerReviews";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import TopSellers from "@/components/TopSellers";
import FeaturedBrands from "@/components/FeaturedBrands";
import NewArrivals from "@/components/NewArrivals";
import FlashDeal from "@/components/FlashDeal";
import Newsletter from "@/components/Newsletter";
import { Skeleton } from "@/components/ui/skeleton";
import { PullToRefresh } from "@/components/PullToRefresh";

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
  // Fetch categories from database
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
  });

  // Fetch featured products from database
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
      <div className="min-h-screen bg-background">
        <Navbar />
      <Hero />
      <FeaturesBar />

      {/* Top Categories */}
      <section className="py-6 sm:py-8 bg-secondary/30" id="categories">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-foreground">
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

          {/* Horizontal Scroll Container */}
          <div className="relative">
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
              {categoriesLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="shrink-0">
                    <Skeleton className="w-16 h-16 sm:w-24 sm:h-24 rounded-full" />
                    <Skeleton className="w-16 sm:w-20 h-3 sm:h-4 mt-2 mx-auto" />
                  </div>
                ))
              ) : (
                categories.map((category, index) => (
                  <div
                    key={category.id}
                    className="animate-fade-in shrink-0"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CategoryCard
                      name={category.name}
                      icon={iconMap[category.icon || "Tv"] || Tv}
                      count={category.product_count || 0}
                      image={category.image_url || ""}
                    />
                  </div>
                ))
              )}
            </div>
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

      <FlashDeal />

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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))}
            </div>
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

      <NewArrivals />
      <FeaturedBrands />
      <TopSellers />
      <CustomerReviews />
      <Newsletter />
      <FAQ />
      <Footer />
      </div>
    </PullToRefresh>
  );
};

export default Index;
