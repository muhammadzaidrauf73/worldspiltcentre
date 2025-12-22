import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, ArrowRight, Crown, Flame, Star, TrendingUp } from "lucide-react";
import ProductCarousel from "./ProductCarousel";
import { ProductGridSkeleton } from "./ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const TopSellers = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["top-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_top_seller", true)
        .order("reviews_count", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-8 sm:py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-11 w-28" />
          </div>
          <ProductGridSkeleton count={4} />
        </div>
      </section>
    );
  }

  if (!products?.length) return null;

  return (
    <section className="py-8 sm:py-14 relative overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-orange-500/6 to-red-500/8 dark:from-amber-500/15 dark:via-orange-500/10 dark:to-red-500/15" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-amber-300/25 to-orange-300/25 dark:from-amber-500/15 dark:to-orange-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-orange-300/25 to-red-300/25 dark:from-orange-500/15 dark:to-red-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-64 h-64 bg-yellow-300/20 dark:bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-16 right-[12%] opacity-30 dark:opacity-20">
        <Crown className="h-8 w-8 text-amber-500 animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      <div className="absolute bottom-20 left-[8%] opacity-30 dark:opacity-20">
        <Flame className="h-7 w-7 text-orange-500 animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      <div className="absolute top-1/3 left-[15%] opacity-25 dark:opacity-15">
        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Premium animated icon */}
            <div className="relative group">
              {/* Outer glow */}
              <div className="absolute -inset-3 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-500" />
              {/* Rotating gold ring */}
              <div className="absolute -inset-1.5 rounded-2xl border-2 border-dashed border-amber-400/60 dark:border-amber-500/40 animate-spin" style={{ animationDuration: '15s' }} />
              {/* Icon container */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/40 rotate-3 hover:rotate-0 transition-transform duration-300">
                <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
              </div>
              {/* Crown accent */}
              <Crown className="absolute -top-3 -right-2 h-6 w-6 text-yellow-400 drop-shadow-lg animate-bounce" style={{ animationDuration: '2.5s' }} />
              {/* Fire accent */}
              <Flame className="absolute -bottom-1 -left-1 h-4 w-4 text-orange-300 animate-pulse" style={{ animationDuration: '1s' }} />
            </div>
            
            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 dark:from-amber-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                  Top Sellers
                </h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 dark:from-orange-500/30 dark:to-red-500/30 text-orange-700 dark:text-orange-300 text-[10px] sm:text-xs font-bold border border-orange-300/50 dark:border-orange-500/30 backdrop-blur-sm animate-pulse" style={{ animationDuration: '2s' }}>
                  <Flame className="h-3 w-3" />
                  HOT
                </span>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Our most loved products this month
              </p>
            </div>
          </div>
          
          <Link to="/products?sort=bestselling">
            <Button 
              variant="outline" 
              className="group relative overflow-hidden border-amber-300/50 dark:border-amber-500/30 bg-white/50 dark:bg-amber-950/30 backdrop-blur-sm hover:border-orange-500 text-amber-700 dark:text-amber-300 h-10 sm:h-11 px-5 sm:px-6 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
            >
              <span className="relative z-10 flex items-center">
                View All
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </Link>
        </div>

        {/* Products */}
        <ProductCarousel products={products} badge="🏆 Best Seller" />

        {/* Bottom Stats with glass effect */}
        <div className="mt-6 sm:mt-8">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-amber-200/50 dark:border-amber-500/20 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">{products.length}+</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Top Products</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-orange-200/50 dark:border-orange-500/20 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <Star className="h-5 w-5 text-white fill-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">1000+</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Happy Customers</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-yellow-200/50 dark:border-yellow-500/20 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">4.8★</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Avg. Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopSellers;
