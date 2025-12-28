import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  link: string | null;
  button_color: string | null;
}

// Preload images for faster LCP
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
};

const Hero = memo(() => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0]));
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const { data: banners = [] } = useQuery({
    queryKey: ["promotional-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotional_banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Preload first 2 banners immediately
  useEffect(() => {
    if (banners.length > 0) {
      preloadImage(banners[0].image_url);
      if (banners.length > 1) {
        preloadImage(banners[1].image_url);
      }
    }
  }, [banners]);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden w-full sm:bg-secondary/30 group/hero">
      <div 
        className="relative w-full aspect-[2/1] sm:aspect-[21/9] lg:aspect-[3/1]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {banners.map((banner, index) => (
          <Link
            key={banner.id}
            to={banner.link || "/products"}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : index < currentSlide
                ? "opacity-0 -translate-x-full"
                : "opacity-0 translate-x-full"
            }`}
          >
            <div className="relative h-full w-full bg-muted">
              {/* Mobile: show full image (contain) + blurred cover backdrop to avoid gaps */}
              <img
                src={banner.image_url}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-center blur-md scale-110 sm:hidden"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />

              <img
                src={banner.image_url}
                alt={banner.title}
                width={1200}
                height={400}
                className="relative z-10 w-full h-full object-contain sm:object-cover object-center"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding={index === 0 ? "sync" : "async"}
              />
              {/* Gradient overlay - Minimal on mobile, more visible on desktop for button */}
              <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-24 bg-gradient-to-t from-foreground/20 sm:from-foreground/50 to-transparent" />
              
              {/* Shop button - Hidden on mobile */}
              <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 hidden sm:block">
                <Button 
                  className="font-semibold px-3 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-base text-white hover:opacity-90 transition-opacity shadow-lg h-auto min-h-[36px] sm:min-h-[40px]"
                  style={{ backgroundColor: banner.button_color || '#f97316' }}
                >
                  Shop Now
                </Button>
              </div>
            </div>
          </Link>
        ))}

        {/* Navigation Arrows - Show only on hover (desktop) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prevSlide(); }}
              aria-label="Previous slide"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm hidden sm:flex items-center justify-center hover:bg-card active:bg-card/90 transition-all duration-300 z-20 opacity-0 group-hover/hero:opacity-100 -translate-x-4 group-hover/hero:translate-x-0 shadow-lg"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); nextSlide(); }}
              aria-label="Next slide"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm hidden sm:flex items-center justify-center hover:bg-card active:bg-card/90 transition-all duration-300 z-20 opacity-0 group-hover/hero:opacity-100 translate-x-4 group-hover/hero:translate-x-0 shadow-lg"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>

            {/* Unique Dots Design - Line indicator style */}
            <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-foreground/20 backdrop-blur-sm rounded-full px-3 py-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.preventDefault(); goToSlide(index); }}
                  aria-label={`Go to slide ${index + 1}`}
                  className="relative group/dot"
                >
                  <span className={`block rounded-full transition-all duration-500 ease-out ${
                    index === currentSlide
                      ? "w-6 sm:w-8 h-2 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                      : "w-2 h-2 bg-card/60 hover:bg-card/80"
                  }`} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
});

export default Hero;
