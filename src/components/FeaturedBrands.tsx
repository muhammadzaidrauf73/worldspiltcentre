import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useState } from "react";
import { Award } from "lucide-react";

const BrandCircle = memo(({ brand, index }: { brand: any; index: number }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      to={`/products?brand=${encodeURIComponent(brand.name)}`}
      className="group block animate-fade-in"
      title={brand.name}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-card backdrop-blur-sm border border-border shadow-md hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:scale-105">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-primary/0 group-hover:bg-primary/5 transition-all duration-300" />
        
        {brand.logo_url && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-secondary/30 animate-pulse rounded-2xl" />
            )}
            <img
              src={brand.logo_url}
              alt={brand.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`max-w-[80%] max-h-[80%] object-contain transition-all duration-300 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <span className="font-bold text-foreground text-xs sm:text-sm text-center leading-tight">
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
      <section className="py-8 sm:py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center mb-8">
            <Skeleton className="h-10 w-56 mb-2" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="w-full aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
          </div>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground mb-1">
            Shop by Brand
          </h2>
          <p className="text-sm text-muted-foreground">
            Premium brands with guaranteed quality
          </p>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 sm:gap-4 place-items-center">
          {brands.slice(0, 20).map((brand: any, index: number) => (
            <BrandCircle key={brand.id} brand={brand} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturedBrands.displayName = "FeaturedBrands";

export default FeaturedBrands;
