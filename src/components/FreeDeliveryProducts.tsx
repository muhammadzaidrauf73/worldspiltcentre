import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCarousel from "@/components/ProductCarousel";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { Truck, Gift, Sparkles } from "lucide-react";
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
    <section className="py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/3" />
      
      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
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
      </div>
    </section>
  );
};

export default FreeDeliveryProducts;
