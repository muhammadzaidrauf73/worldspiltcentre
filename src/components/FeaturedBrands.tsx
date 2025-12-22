import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useState } from "react";
import { Award, Sparkles, Star } from "lucide-react";

const BrandCircle = memo(({ brand }: { brand: any }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      to={`/products?brand=${encodeURIComponent(brand.name)}`}
      className="group block"
      title={brand.name}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center p-3 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm border-2 border-blue-200/50 dark:border-blue-500/30 shadow-lg hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-110">
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
          <span className="font-bold text-foreground text-[8px] sm:text-[10px] text-center leading-tight">
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

  const orbitBrands = brands.slice(0, 8);

  if (isLoading) {
    return (
      <section className="py-8 sm:py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-teal-500/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center mb-8">
            <Skeleton className="h-10 w-56 mb-2" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full" />
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  return (
    <section className="py-8 sm:py-14 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-cyan-500/6 to-teal-500/8 dark:from-blue-500/15 dark:via-cyan-500/10 dark:to-teal-500/15" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-300/25 to-cyan-300/25 dark:from-blue-500/15 dark:to-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute -bottom-32 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-cyan-300/25 to-teal-300/25 dark:from-cyan-500/15 dark:to-teal-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-20 left-[10%] opacity-30 dark:opacity-20">
        <Star className="h-6 w-6 text-blue-400 fill-blue-400 animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      <div className="absolute bottom-24 right-[12%] opacity-30 dark:opacity-20">
        <Sparkles className="h-7 w-7 text-cyan-500 animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Unified Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <div className="flex items-center gap-4 sm:gap-5 mb-4">
            {/* Premium animated icon */}
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-500" />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 rounded-2xl opacity-75 animate-spin" style={{ animationDuration: '8s' }} />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                <Award className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 dark:from-blue-400 dark:via-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
              Shop by Brand
            </h2>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-500/30 dark:to-cyan-500/30 text-blue-700 dark:text-blue-300 text-[10px] sm:text-xs font-bold border border-blue-300/50 dark:border-blue-500/30 backdrop-blur-sm">
              <Award className="h-3 w-3" />
              TRUSTED
            </span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse shadow-lg shadow-blue-500/50" />
            Premium brands, guaranteed quality
          </p>
        </div>

        {/* Orbital Container */}
        <div className="flex justify-center items-center">
          <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px]">
            {/* Center decoration */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center border-2 border-blue-200/50 dark:border-blue-500/20">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">{orbitBrands.length}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Brands</p>
                </div>
              </div>
            </div>

            {/* Rotating brands container */}
            <div 
              className="absolute inset-0"
              style={{ 
                animation: 'spin 30s linear infinite',
                transformOrigin: 'center center'
              }}
            >
              {orbitBrands.map((brand: any, index: number) => {
                const angle = (index / orbitBrands.length) * 360 - 90;
                const radius = 32;
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
