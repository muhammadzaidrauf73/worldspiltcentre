import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCarousel from "@/components/ProductCarousel";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { Truck, ArrowRight, Gift, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FreeDeliveryProducts = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["free-delivery-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_free_delivery", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Don't render if no free delivery products
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-10 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-cyan-50/90 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40" />
      
      {/* Animated decorative elements */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-emerald-200/40 dark:bg-emerald-800/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-teal-200/40 dark:bg-teal-800/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
      <div className="absolute top-1/2 right-0 w-40 h-40 bg-cyan-200/30 dark:bg-cyan-800/10 rounded-full blur-2xl" />
      
      {/* Floating icons decoration */}
      <div className="absolute top-20 right-[15%] opacity-20 dark:opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>
        <Package className="h-12 w-12 text-emerald-500" />
      </div>
      <div className="absolute bottom-24 left-[10%] opacity-20 dark:opacity-10 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
        <Truck className="h-10 w-10 text-teal-500" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-7 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Animated Icon */}
            <div className="relative shrink-0">
              {/* Outer ring animation */}
              <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-emerald-400/40 dark:border-emerald-500/30 animate-spin" style={{ animationDuration: '20s' }} />
              {/* Ping effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/40 to-teal-400/40 dark:from-emerald-500/30 dark:to-teal-500/30 animate-ping" style={{ animationDuration: '3s' }} />
              {/* Main icon container */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 dark:from-emerald-500 dark:via-green-600 dark:to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Truck className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
                <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-300 drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
              </div>
            </div>
            
            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Free Delivery
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 text-amber-700 dark:text-amber-300 text-[10px] sm:text-xs font-bold border border-amber-200/50 dark:border-amber-700/30 shadow-sm">
                  <Gift className="h-3 w-3" />
                  ZERO SHIPPING
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-700/70 dark:text-emerald-300/60 mt-0.5">
                Add any of these to unlock free shipping on your entire order!
              </p>
            </div>
          </div>
          
          <Link to="/products?delivery=free">
            <Button 
              variant="outline" 
              className="border-emerald-300 dark:border-emerald-700 bg-white/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 group"
            >
              View All
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Products */}
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <ProductCarousel products={products} />
        )}

        {/* Bottom CTA Banner */}
        <div className="mt-5 sm:mt-7">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 dark:from-emerald-600 dark:via-green-600 dark:to-teal-600 p-4 sm:p-6 text-white shadow-lg shadow-emerald-500/25">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base">
                    💡 Pro Tip: One item unlocks FREE shipping for everything!
                  </p>
                  <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                    Add any free delivery product and save on shipping costs
                  </p>
                </div>
              </div>
              <Link to="/products?delivery=free">
                <Button 
                  size="sm"
                  className="bg-white text-emerald-600 hover:bg-white/90 font-semibold shadow-lg whitespace-nowrap"
                >
                  Shop Now
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreeDeliveryProducts;