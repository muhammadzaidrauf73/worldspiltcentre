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
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-pink-500/5" />
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
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-pink-500/8 dark:from-violet-500/15 dark:via-fuchsia-500/10 dark:to-pink-500/15" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 dark:from-violet-500/15 dark:to-fuchsia-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 dark:from-fuchsia-500/15 dark:to-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-violet-300/10 to-transparent dark:from-violet-400/5 rounded-full blur-3xl" />
      </div>

      {/* Floating decorative stars */}
      <div className="absolute top-20 left-[10%] opacity-30 dark:opacity-20">
        <Star className="h-6 w-6 text-violet-400 fill-violet-400 animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      <div className="absolute bottom-32 right-[15%] opacity-30 dark:opacity-20">
        <Star className="h-8 w-8 text-fuchsia-400 fill-fuchsia-400 animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
      </div>
      <div className="absolute top-1/3 right-[8%] opacity-25 dark:opacity-15">
        <Zap className="h-5 w-5 text-pink-400 animate-bounce" style={{ animationDuration: '2.5s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          icon={Sparkles}
          title="New Arrivals"
          description="Fresh products just landed this week"
          badge={{ icon: Zap, text: "JUST IN" }}
          accentIcon={Star}
          secondaryAccentIcon={Star}
          linkTo="/products?sort=newest"
          theme="violet"
        />

        {/* Products carousel */}
        <div className="relative">
          <ProductCarousel products={products} badge="✨ New" />
        </div>

        {/* Stats bar */}
        <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-6 sm:gap-12">
          <div className="text-center group">
            <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{products.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">New Products</p>
          </div>
          <div className="text-center group">
            <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 dark:from-fuchsia-400 dark:to-pink-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">This Week</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Fresh Arrivals</p>
          </div>
          <div className="text-center group">
            <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-violet-600 dark:from-pink-400 dark:to-violet-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">Limited</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Stock Available</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
