import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useState } from "react";

// Brand circle component - no label for cleaner orbit
const BrandCircle = memo(({ brand }: { brand: any }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      to={`/products?brand=${encodeURIComponent(brand.name)}`}
      className="group block"
      title={brand.name}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center p-2 rounded-full bg-card border-2 border-border shadow-md hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-110">
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
          <span className="font-bold text-foreground text-[10px] sm:text-xs text-center leading-tight">
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
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
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
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
            
            {/* Orbit Ring - rotating dashed circle */}
            <div 
              className="absolute inset-[12%] rounded-full border-2 border-dashed border-primary/30"
              style={{ animation: 'spin 40s linear infinite' }}
            />
            
            {/* Center Circle */}
            <div className="absolute inset-[35%] rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 flex items-center justify-center z-10 shadow-lg">
              <span className="text-base sm:text-lg md:text-xl font-bold text-primary">Brands</span>
            </div>

            {/* Rotating brands container */}
            <div 
              className="absolute inset-0 brands-orbit"
              style={{ 
                animation: 'spin 30s linear infinite',
                transformOrigin: 'center center'
              }}
            >
              {orbitBrands.map((brand: any, index: number) => {
                const angle = (index / orbitBrands.length) * 360 - 90;
                const radius = 38; // percentage from center
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
                      animation: 'counter-spin 30s linear infinite',
                      transformOrigin: 'center center'
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
