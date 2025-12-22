import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, ArrowRight, Crown, Flame } from "lucide-react";
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
      <section className="py-6 sm:py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <ProductGridSkeleton count={4} />
        </div>
      </section>
    );
  }

  if (!products?.length) return null;

  return (
    <section className="py-6 sm:py-10 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-200/40 dark:bg-amber-800/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-orange-200/40 dark:bg-orange-800/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-0 w-32 h-32 bg-yellow-200/30 dark:bg-yellow-800/10 rounded-full blur-2xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Animated Icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/40 to-orange-400/40 dark:from-amber-500/30 dark:to-orange-500/30 animate-pulse" style={{ animationDuration: '2s' }} />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 dark:from-amber-500 dark:via-orange-600 dark:to-yellow-600 flex items-center justify-center shadow-xl shadow-orange-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
                <Crown className="absolute -top-2 -right-2 h-5 w-5 text-yellow-300 drop-shadow-lg animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>
            
            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-600 dark:from-amber-400 dark:via-orange-400 dark:to-yellow-400 bg-clip-text text-transparent">
                  Top Sellers
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 text-orange-700 dark:text-orange-300 text-[10px] sm:text-xs font-bold border border-orange-200/50 dark:border-orange-700/30">
                  <Flame className="h-3 w-3 animate-pulse" style={{ animationDuration: '1s' }} />
                  HOT
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-700/70 dark:text-amber-300/60 mt-0.5">
                Our most loved products this month
              </p>
            </div>
          </div>
          
          <Link to="/products?sort=bestselling">
            <Button 
              variant="outline" 
              className="border-amber-300 dark:border-amber-700 bg-white/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 group"
            >
              View All
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Products */}
        <ProductCarousel products={products} badge="🏆 Best Seller" />

        {/* Bottom Stats */}
        <div className="mt-5 sm:mt-7 flex flex-wrap justify-center gap-4 sm:gap-8">
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">{products.length}+</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Top Products</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">1000+</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Happy Customers</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">4.8★</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Avg. Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopSellers;