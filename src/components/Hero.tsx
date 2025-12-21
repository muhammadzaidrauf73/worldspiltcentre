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
    <section className="relative overflow-hidden w-full sm:bg-secondary/30">
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
            <div className="relative h-full w-full">
              <img
                src={banner.image_url}
                alt={banner.title}
                width={1200}
                height={400}
                className="w-full h-full object-cover object-center"
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

        {/* Navigation Arrows - Hidden on mobile, visible on tablet/desktop */}
        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prevSlide(); }}
              aria-label="Previous slide"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur hidden sm:flex items-center justify-center hover:bg-card active:bg-card/90 transition-smooth z-20"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); nextSlide(); }}
              aria-label="Next slide"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur hidden sm:flex items-center justify-center hover:bg-card active:bg-card/90 transition-smooth z-20"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>

            {/* Dots - Smaller on mobile, larger on desktop */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-3 z-20">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.preventDefault(); goToSlide(index); }}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`rounded-full transition-all duration-300 w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center ${
                    index === currentSlide
                      ? "bg-primary/80"
                      : "bg-card/40 hover:bg-card/60"
                  }`}
                >
                  <span className={`rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-primary w-4 sm:w-6 md:w-8 h-1.5 sm:h-2"
                      : "bg-card/60 w-1.5 h-1.5 sm:w-2 sm:h-2"
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
