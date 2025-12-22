import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Star, Zap } from "lucide-react";
import ProductCarousel from "./ProductCarousel";
import { ProductGridSkeleton } from "./ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "./SectionHeader";

const NewArrivals = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["new-arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_new_arrival", true)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-8 sm:py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
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
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-20 left-[10%] opacity-20">
        <Star className="h-6 w-6 text-primary fill-primary animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      <div className="absolute bottom-32 right-[15%] opacity-20">
        <Sparkles className="h-7 w-7 text-accent animate-pulse" style={{ animationDuration: '3s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          icon={Sparkles}
          title="New Arrivals"
          description="Fresh products just landed this week"
          badge={{ icon: Zap, text: "JUST IN" }}
          accentIcon={Star}
          linkTo="/products?sort=newest"
        />

        {/* Products carousel */}
        <div className="relative">
          <ProductCarousel products={products} badge="✨ New" />
        </div>

        {/* Stats bar */}
        <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-6 sm:gap-12">
          <div className="text-center group">
            <p className="text-xl sm:text-2xl font-bold text-primary group-hover:scale-110 transition-transform">{products.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">New Products</p>
          </div>
          <div className="text-center group">
            <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:scale-110 transition-transform">This Week</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Fresh Arrivals</p>
          </div>
          <div className="text-center group">
            <p className="text-xl sm:text-2xl font-bold text-accent group-hover:scale-110 transition-transform">Limited</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Stock Available</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
