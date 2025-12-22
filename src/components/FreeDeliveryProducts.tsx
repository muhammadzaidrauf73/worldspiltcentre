import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCarousel from "@/components/ProductCarousel";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { SectionHeader } from "./SectionHeader";
import { Skeleton } from "@/components/ui/skeleton";

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
        .limit(10);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!isLoading && products.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-4 sm:py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <ProductGridSkeleton count={5} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 sm:py-6 bg-card">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Free Delivery"
          linkTo="/products?delivery=free"
        />
        <ProductCarousel products={products} />
      </div>
    </section>
  );
};

export default FreeDeliveryProducts;
