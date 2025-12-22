import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useState } from "react";

// Memoized brand item for orbital display
const BrandItem = memo(({ brand, index, total, ringIndex }: { brand: any; index: number; total: number; ringIndex: number }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Calculate position on the ring
  const angle = (index / total) * 360;
  const animationDelay = index * 0.1;

  return (
    <Link
      to={`/products?brand=${encodeURIComponent(brand.name)}`}
      className="absolute animate-fade-in group"
      style={{
        transform: `rotate(${angle}deg) translateY(-50%)`,
        animationDelay: `${animationDelay}s`,
      }}
    >
      <div
        className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center p-2 rounded-full bg-card border-2 border-border shadow-lg hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-110"
        style={{
          transform: `rotate(-${angle}deg)`, // Counter-rotate to keep logos upright
        }}
      >
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
              className={`max-w-[80%] max-h-[80%] object-contain transition-all duration-300 group-hover:scale-110 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <span className="font-bold text-foreground text-[8px] sm:text-[10px] text-center leading-tight">
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
    staleTime: 5 * 60 * 1000,
  });

  // Split brands into rings (inner and outer)
  const innerRingBrands = brands.slice(0, Math.min(4, brands.length));
  const outerRingBrands = brands.slice(4, Math.min(10, brands.length));

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
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
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
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-[400px] md:h-[400px]">
            
            {/* Outer Ring Background */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-border/30 animate-[spin_60s_linear_infinite]" />
            
            {/* Middle Ring Background */}
            <div className="absolute inset-[15%] rounded-full border-2 border-dashed border-border/40 animate-[spin_45s_linear_infinite_reverse]" />
            
            {/* Inner Ring Background */}
            <div className="absolute inset-[35%] rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20" />

            {/* Decorative Glow */}
            <div className="absolute inset-[38%] rounded-full bg-primary/10 blur-xl" />

            {/* Center Logo/Text */}
            <div className="absolute inset-[40%] rounded-full bg-card border-2 border-primary/30 shadow-lg flex items-center justify-center">
              <span className="text-xs sm:text-sm md:text-base font-bold text-primary">Brands</span>
            </div>

            {/* Outer Ring Brands */}
            {outerRingBrands.length > 0 && (
              <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                  width: '100%', 
                  height: '100%',
                }}
              >
                {outerRingBrands.map((brand: any, index: number) => {
                  const angle = (index / outerRingBrands.length) * 360 - 90;
                  const radius = 50; // percentage
                  const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                  const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
                  
                  return (
                    <Link
                      key={brand.id}
                      to={`/products?brand=${encodeURIComponent(brand.name)}`}
                      className="absolute animate-fade-in group"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                        animationDelay: `${index * 0.1}s`,
                      }}
                    >
                      <BrandCircle brand={brand} size="md" />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Inner Ring Brands */}
            {innerRingBrands.length > 0 && (
              <div className="absolute inset-[15%]">
                {innerRingBrands.map((brand: any, index: number) => {
                  const angle = (index / innerRingBrands.length) * 360 - 90 + 45; // Offset by 45 degrees
                  const radius = 50;
                  const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                  const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
                  
                  return (
                    <Link
                      key={brand.id}
                      to={`/products?brand=${encodeURIComponent(brand.name)}`}
                      className="absolute animate-fade-in group"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                        animationDelay: `${(index + outerRingBrands.length) * 0.1}s`,
                      }}
                    >
                      <BrandCircle brand={brand} size="sm" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

// Separate component for brand circles
const BrandCircle = memo(({ brand, size }: { brand: any; size: 'sm' | 'md' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = size === 'md' 
    ? 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16' 
    : 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14';

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center p-2 rounded-full bg-card border-2 border-border shadow-lg hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-110 group-hover:ring-4 group-hover:ring-primary/20`}
    >
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
            className={`max-w-[75%] max-h-[75%] object-contain transition-all duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </>
      ) : (
        <span className="font-bold text-foreground text-[7px] sm:text-[9px] text-center leading-tight">
          {brand.name}
        </span>
      )}
    </div>
  );
});

BrandCircle.displayName = "BrandCircle";
FeaturedBrands.displayName = "FeaturedBrands";

export default FeaturedBrands;
