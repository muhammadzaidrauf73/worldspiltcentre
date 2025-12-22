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
      <section className="py-8 sm:py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center mb-6">
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
    <section className="py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
      
      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
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
      </div>
    </section>
  );
};

export default TopSellers;
