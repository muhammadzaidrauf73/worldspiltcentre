import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCarousel from "@/components/ProductCarousel";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { Truck, ArrowRight, Gift } from "lucide-react";

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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-green-50/60 to-teal-50/80 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/30" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-200/30 dark:bg-emerald-800/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-teal-200/30 dark:bg-teal-800/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-xl bg-emerald-400/30 dark:bg-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Truck className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
            
            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                  Free Delivery
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] sm:text-xs font-semibold">
                  <Gift className="h-3 w-3" />
                  NO EXTRA COST
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Products with free shipping on your entire order
              </p>
            </div>
          </div>
          
          <Link
            to="/products?delivery=free"
            className="group flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline transition-all text-xs sm:text-sm"
          >
            View All
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Products */}
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <ProductCarousel products={products} />
        )}

        {/* Bottom CTA */}
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-emerald-700/80 dark:text-emerald-300/70">
            💡 <span className="font-medium">Pro tip:</span> Add any of these products to your cart and get{" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE shipping</span> on your entire order!
          </p>
        </div>
      </div>
    </section>
  );
};

export default FreeDeliveryProducts;