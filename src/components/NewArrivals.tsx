import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

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

  if (!products?.length) return null;

  return (
    <section className="py-4 sm:py-6 bg-card">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="New Arrivals"
          linkTo="/products?sort=newest"
        />
        <ProductCarousel products={products} />
      </div>
    </section>
  );
};

export default NewArrivals;
