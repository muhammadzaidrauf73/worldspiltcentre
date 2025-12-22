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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
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
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
      
      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-16 right-[12%] opacity-20">
        <Crown className="h-8 w-8 text-primary animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      <div className="absolute bottom-20 left-[8%] opacity-20">
        <Flame className="h-7 w-7 text-primary animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          icon={Trophy}
          title="Top Sellers"
          description="Our most loved products this month"
          badge={{ icon: Flame, text: "HOT" }}
          accentIcon={Crown}
          linkTo="/products?sort=bestselling"
        />

        {/* Products */}
        <ProductCarousel products={products} badge="🏆 Best Seller" />

        {/* Bottom Stats */}
        <div className="mt-6 sm:mt-8">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-primary">{products.length}+</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Top Products</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Star className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-foreground">1000+</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Happy Customers</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-accent">4.8★</p>
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
