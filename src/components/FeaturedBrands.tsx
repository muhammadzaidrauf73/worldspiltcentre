import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useState } from "react";

const BrandCircle = memo(({ brand }: { brand: any }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      to={`/products?brand=${encodeURIComponent(brand.name)}`}
      className="group block"
      title={brand.name}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2 sm:p-3 rounded-lg bg-white border border-border hover:border-primary hover:shadow-md transition-all duration-200">
        {brand.logo_url && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="w-full h-full bg-secondary/30 animate-pulse rounded" />
            )}
            <img
              src={brand.logo_url}
              alt={brand.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`max-w-full max-h-full object-contain ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <span className="font-semibold text-foreground text-xs text-center">
            {brand.name}
          </span>
        )}
      </div>
    </Link>
  );
});

BrandCircle.displayName = "BrandCircle";

const FeaturedBrands = memo(() => {
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="py-4 sm:py-6 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  return (
    <section className="py-4 sm:py-6 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">
          Shop by Brand
        </h2>

        {/* Brands scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {brands.map((brand: any) => (
            <BrandCircle key={brand.id} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturedBrands.displayName = "FeaturedBrands";

export default FeaturedBrands;
