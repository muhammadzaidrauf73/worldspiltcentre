import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCarousel from "@/components/ProductCarousel";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { Truck, ArrowRight, Gift, Package, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./SectionHeader";

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
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/3" />
      
      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-20 right-[15%] opacity-20">
        <Package className="h-10 w-10 text-accent animate-bounce" style={{ animationDuration: '4s' }} />
      </div>
      <div className="absolute bottom-28 left-[10%] opacity-20">
        <Truck className="h-8 w-8 text-accent animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          icon={Truck}
          title="Free Delivery"
          description="Add any of these to unlock free shipping on your order!"
          badge={{ icon: Gift, text: "ZERO COST" }}
          accentIcon={Sparkles}
          linkTo="/products?delivery=free"
        />

        {/* Products */}
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <ProductCarousel products={products} badge="🚚 Free Shipping" />
        )}

        {/* Bottom CTA Banner */}
        <div className="mt-6 sm:mt-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-accent p-5 sm:p-8 text-accent-foreground shadow-2xl shadow-accent/20">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ 
                backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }} />
            </div>
            
            {/* Floating truck */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block">
              <Truck className="h-32 w-32 animate-bounce" style={{ animationDuration: '4s' }} />
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center border border-white/20">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-bold text-base sm:text-lg flex items-center gap-2 justify-center sm:justify-start">
                    💡 Pro Tip: One item unlocks FREE shipping for everything!
                  </p>
                  <p className="text-sm sm:text-base text-white/80 mt-1">
                    Add any free delivery product and save on shipping costs
                  </p>
                </div>
              </div>
              <Link to="/products?delivery=free" className="shrink-0">
                <Button 
                  size="lg"
                  className="bg-white text-accent hover:bg-white/90 font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-6"
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
