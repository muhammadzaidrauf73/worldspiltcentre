import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, Star } from "lucide-react";
import ProductCarousel from "./ProductCarousel";
import { ProductGridSkeleton } from "./ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
      <section className="py-6 sm:py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
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
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Animated icon container */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur-md opacity-50 animate-pulse" />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              {/* Sparkle decorations */}
              <Star className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
            
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  New Arrivals
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Fresh products just landed
              </p>
            </div>
          </div>
          
          <Link to="/products?sort=newest">
            <Button 
              variant="outline" 
              className="group border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 h-9 sm:h-10 px-4 sm:px-5 rounded-full transition-all duration-300"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Products carousel with enhanced styling */}
        <div className="relative">
          <ProductCarousel products={products} badge="New" />
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
