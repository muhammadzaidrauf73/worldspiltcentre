import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useState } from "react";
import { Award, Sparkles, Star, ShieldCheck } from "lucide-react";

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
      <div className="relative w-18 h-18 sm:w-22 sm:h-22 md:w-26 md:h-26 flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-sm border-2 border-indigo-200/50 dark:border-indigo-500/30 shadow-lg hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-500 hover:scale-110 hover:-translate-y-2">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
        
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
              className={`max-w-[85%] max-h-[85%] object-contain transition-all duration-500 group-hover:scale-110 ${
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
      {/* Brand name tooltip on hover */}
      <p className="text-center mt-2 text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[80px] sm:max-w-[100px] mx-auto">
        {brand.name}
      </p>
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
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
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
    <section className="py-8 sm:py-14 relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-purple-500/6 to-pink-500/8 dark:from-indigo-500/15 dark:via-purple-500/10 dark:to-pink-500/15" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-300/20 to-purple-300/20 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-300/20 to-pink-300/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 -translate-y-1/2 -left-20 w-80 h-80 bg-indigo-300/15 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -translate-y-1/2 -right-20 w-80 h-80 bg-pink-300/15 dark:bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-16 left-[8%] opacity-30 dark:opacity-20">
        <Star className="h-6 w-6 text-indigo-400 fill-indigo-400 animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      <div className="absolute top-24 right-[10%] opacity-30 dark:opacity-20">
        <Sparkles className="h-7 w-7 text-purple-500 animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      <div className="absolute bottom-20 left-[15%] opacity-25 dark:opacity-15">
        <ShieldCheck className="h-8 w-8 text-pink-400 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
      </div>
      <div className="absolute bottom-28 right-[12%] opacity-25 dark:opacity-15">
        <Award className="h-6 w-6 text-indigo-500 animate-bounce" style={{ animationDuration: '4s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Unified Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <div className="flex items-center gap-4 sm:gap-5 mb-4">
            {/* Premium animated icon */}
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-500" />
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 rounded-2xl opacity-75 animate-spin" style={{ animationDuration: '8s' }} />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/40">
                <Award className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
              <Star className="absolute -bottom-1 -left-1 h-4 w-4 text-pink-300 fill-pink-300 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Shop by Brand
            </h2>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] sm:text-xs font-bold border border-indigo-300/50 dark:border-indigo-500/30 backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" />
              TRUSTED
            </span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse shadow-lg shadow-indigo-500/50" />
            Premium brands with guaranteed quality
          </p>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6 md:gap-8 place-items-center">
          {brands.slice(0, 16).map((brand: any, index: number) => (
            <BrandCircle key={brand.id} brand={brand} index={index} />
          ))}
        </div>

        {/* Bottom trust badges */}
        <div className="mt-8 sm:mt-12 flex flex-wrap justify-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-indigo-200/50 dark:border-indigo-500/20 shadow-md">
            <ShieldCheck className="h-5 w-5 text-indigo-500" />
            <span className="text-xs sm:text-sm font-medium text-foreground">100% Authentic</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-purple-200/50 dark:border-purple-500/20 shadow-md">
            <Award className="h-5 w-5 text-purple-500" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Official Partners</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-pink-200/50 dark:border-pink-500/20 shadow-md">
            <Sparkles className="h-5 w-5 text-pink-500" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Premium Quality</span>
          </div>
        </div>
      </div>
    </section>
  );
});

FeaturedBrands.displayName = "FeaturedBrands";

export default FeaturedBrands;
