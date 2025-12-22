import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown, Flame, Star, TrendingUp } from "lucide-react";
import ProductCarousel from "./ProductCarousel";
import { ProductGridSkeleton } from "./ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "./SectionHeader";

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
        <SectionHeader
          icon={Trophy}
          title="Top Sellers"
          description="Our most loved products this month"
          badge={{ icon: Flame, text: "HOT" }}
          accentIcon={Crown}
          secondaryAccentIcon={Flame}
          linkTo="/products?sort=bestselling"
          theme="amber"
        />

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
