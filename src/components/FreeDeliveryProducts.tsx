import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCarousel from "@/components/ProductCarousel";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { Truck, ArrowRight, Gift, Package, Sparkles, CheckCircle2, Zap } from "lucide-react";
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

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-14 relative overflow-hidden">
      {/* Fresh gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-green-500/6 to-teal-500/8 dark:from-emerald-500/15 dark:via-green-500/10 dark:to-teal-500/15" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-emerald-300/25 to-green-300/25 dark:from-emerald-500/15 dark:to-green-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute -bottom-32 right-1/3 w-[400px] h-[400px] bg-gradient-to-br from-green-300/25 to-teal-300/25 dark:from-green-500/15 dark:to-teal-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-64 h-64 bg-cyan-300/20 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-[15%] opacity-25 dark:opacity-15">
        <Package className="h-10 w-10 text-emerald-500 animate-bounce" style={{ animationDuration: '4s' }} />
      </div>
      <div className="absolute bottom-28 left-[10%] opacity-25 dark:opacity-15">
        <Truck className="h-8 w-8 text-teal-500 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
      </div>
      <div className="absolute top-1/3 left-[20%] opacity-20 dark:opacity-10">
        <Gift className="h-6 w-6 text-green-500 animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Premium animated icon */}
            <div className="relative group">
              {/* Outer glow */}
              <div className="absolute -inset-3 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-500" />
              {/* Dashed rotating border */}
              <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-emerald-400/50 dark:border-emerald-500/30 animate-spin" style={{ animationDuration: '20s' }} />
              {/* Ping effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/40 to-teal-400/40 animate-ping" style={{ animationDuration: '3s' }} />
              {/* Icon container */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Truck className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
              </div>
              {/* Sparkle accent */}
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
            </div>
            
            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Free Delivery
                </h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 dark:from-amber-500/30 dark:to-yellow-500/30 text-amber-700 dark:text-amber-300 text-[10px] sm:text-xs font-bold border border-amber-300/50 dark:border-amber-500/30 backdrop-blur-sm shadow-sm">
                  <Gift className="h-3 w-3" />
                  ZERO COST
                </span>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Add any of these to unlock free shipping on your order!
              </p>
            </div>
          </div>
          
          <Link to="/products?delivery=free">
            <Button 
              variant="outline" 
              className="group relative overflow-hidden border-emerald-300/50 dark:border-emerald-500/30 bg-white/50 dark:bg-emerald-950/30 backdrop-blur-sm hover:border-emerald-500 text-emerald-700 dark:text-emerald-300 h-10 sm:h-11 px-5 sm:px-6 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20"
            >
              <span className="relative z-10 flex items-center">
                View All
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </Link>
        </div>

        {/* Products */}
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <ProductCarousel products={products} badge="🚚 Free Shipping" />
        )}

        {/* Bottom CTA Banner - Enhanced */}
        <div className="mt-6 sm:mt-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-5 sm:p-8 text-white shadow-2xl shadow-emerald-500/30">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{ 
                backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 1px, transparent 1px), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }} />
            </div>
            
            {/* Floating truck animation */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block">
              <Truck className="h-32 w-32 animate-bounce" style={{ animationDuration: '4s' }} />
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center border border-white/20">
                  <Zap className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-bold text-base sm:text-lg flex items-center gap-2 justify-center sm:justify-start">
                    <span className="text-xl">💡</span> Pro Tip: One item unlocks FREE shipping for everything!
                  </p>
                  <p className="text-sm sm:text-base text-white/80 mt-1">
                    Add any free delivery product and save on shipping costs for your entire order
                  </p>
                </div>
              </div>
              <Link to="/products?delivery=free" className="shrink-0">
                <Button 
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-white/90 font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-6"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
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
