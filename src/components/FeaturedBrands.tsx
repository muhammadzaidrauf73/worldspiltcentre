import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useState } from "react";

// Memoized brand item for better performance
const BrandItem = memo(({ brand, index }: { brand: any; index: number }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      to={`/products?brand=${encodeURIComponent(brand.name)}`}
      className="group animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.15)}s` }}
    >
      <div className="w-16 h-12 sm:w-20 sm:h-14 md:w-28 md:h-16 flex items-center justify-center p-2 sm:p-3 rounded-lg bg-card border border-border hover:border-primary hover:shadow-md transition-smooth grayscale hover:grayscale-0 opacity-60 hover:opacity-100 relative overflow-hidden">
        {brand.logo_url && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-secondary/30 animate-pulse" />
            )}
            <img
              src={brand.logo_url}
              alt={brand.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <span className="font-bold text-foreground text-xs sm:text-sm text-center">
            {brand.name}
          </span>
        )}
      </div>
    </Link>
  );
});

BrandItem.displayName = "BrandItem";

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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <section className="py-4 sm:py-6 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-heading font-bold text-foreground mb-0.5 sm:mb-1">
              Shop by Brand
            </h2>
            <p className="text-xs text-muted-foreground">
              Trusted brands, guaranteed quality
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="w-16 h-12 sm:w-20 sm:h-14 md:w-28 md:h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  return (
    <section className="py-4 sm:py-6 bg-secondary/30 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg md:text-xl font-heading font-bold text-foreground mb-0.5 sm:mb-1">
            Shop by Brand
          </h2>
          <p className="text-xs text-muted-foreground">
            Trusted brands, guaranteed quality
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 md:gap-6">
          {brands.map((brand: any, index: number) => (
            <BrandItem key={brand.id} brand={brand} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturedBrands.displayName = "FeaturedBrands";

export default FeaturedBrands;
