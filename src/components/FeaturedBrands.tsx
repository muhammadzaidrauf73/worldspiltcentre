import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useState } from "react";
import { Award, Sparkles, ShieldCheck } from "lucide-react";

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
      <div className="relative w-18 h-18 sm:w-22 sm:h-22 md:w-26 md:h-26 flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-card backdrop-blur-sm border-2 border-border shadow-lg hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:scale-110 hover:-translate-y-2">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-primary/0 group-hover:bg-primary/5 transition-all duration-500" />
        
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
      {/* Brand name */}
      <p className="text-center mt-2 text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors truncate max-w-[80px] sm:max-w-[100px] mx-auto">
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
    <section className="py-8 sm:py-14 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-16 left-[8%] opacity-15">
        <Award className="h-8 w-8 text-primary animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      <div className="absolute bottom-20 right-[12%] opacity-15">
        <Sparkles className="h-7 w-7 text-accent animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <div className="flex items-center gap-4 sm:gap-5 mb-4">
            {/* Animated icon */}
            <div className="relative group">
              <div className="absolute -inset-3 bg-primary/20 rounded-2xl blur-lg group-hover:bg-primary/30 transition-all duration-500" />
              <div className="absolute -inset-1 bg-primary rounded-2xl opacity-75 animate-spin" style={{ animationDuration: '8s' }} />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                <Award className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground drop-shadow-lg" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-accent drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground">
              Shop by Brand
            </h2>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold border border-primary/30 backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" />
              TRUSTED
            </span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
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
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card backdrop-blur-md border border-border shadow-md">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="text-xs sm:text-sm font-medium text-foreground">100% Authentic</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card backdrop-blur-md border border-border shadow-md">
            <Award className="h-5 w-5 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Official Partners</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card backdrop-blur-md border border-border shadow-md">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Premium Quality</span>
          </div>
        </div>
      </div>
    </section>
  );
});

FeaturedBrands.displayName = "FeaturedBrands";

export default FeaturedBrands;
