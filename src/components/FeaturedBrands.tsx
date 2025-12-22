import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useState } from "react";

// Brand circle component
const BrandCircle = memo(({ brand }: { brand: any }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      to={`/products?brand=${encodeURIComponent(brand.name)}`}
      className="group flex flex-col items-center gap-2"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center p-3 rounded-full bg-card border-2 border-border shadow-md hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-110 group-hover:ring-4 group-hover:ring-primary/20">
        {brand.logo_url && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-secondary/30 animate-pulse rounded-full" />
            )}
            <img
              src={brand.logo_url}
              alt={brand.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`max-w-[80%] max-h-[80%] object-contain transition-all duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <span className="font-bold text-foreground text-xs text-center leading-tight">
            {brand.name}
          </span>
        )}
      </div>
      <span className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
        {brand.name}
      </span>
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

  // Take up to 8 brands for the orbit
  const orbitBrands = brands.slice(0, 8);

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
              Shop by Brand
            </h2>
            <p className="text-sm text-muted-foreground">
              Trusted brands, guaranteed quality
            </p>
          </div>
          <div className="flex justify-center">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[500px] md:h-[500px]">
              <Skeleton className="absolute inset-0 rounded-full" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-secondary/20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
            Shop by Brand
          </h2>
          <p className="text-sm text-muted-foreground">
            Trusted brands, guaranteed quality
          </p>
        </div>

        {/* Orbital Container */}
        <div className="flex justify-center items-center">
          <div className="relative w-80 h-80 sm:w-[420px] sm:h-[420px] md:w-[500px] md:h-[500px]">
            
            {/* Orbit Ring - passes through brand centers (8% inset = 42% radius from center) */}
            <div 
              className="absolute inset-[8%] rounded-full border-2 border-dashed border-primary/30"
              style={{ animation: 'spin 60s linear infinite' }}
            />
            
            {/* Center Circle */}
            <div className="absolute inset-[38%] rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 flex items-center justify-center z-10">
              <div className="text-center">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">Brands</span>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Click to explore</p>
              </div>
            </div>

            {/* Brands positioned around the circle */}
            <div 
              className="absolute inset-0"
              style={{ animation: 'spin 50s linear infinite' }}
            >
              {orbitBrands.map((brand: any, index: number) => {
                const angle = (index / orbitBrands.length) * 360 - 90;
                const radius = 42; // percentage from center
                const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
                
                return (
                  <div
                    key={brand.id}
                    className="absolute"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                      animation: 'counter-spin 50s linear infinite',
                    }}
                  >
                    <BrandCircle brand={brand} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

FeaturedBrands.displayName = "FeaturedBrands";

export default FeaturedBrands;
