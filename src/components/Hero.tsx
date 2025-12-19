import { useState, useEffect, useRef } from "react";
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

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
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
  });

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
    <section className="relative overflow-hidden w-full bg-secondary/30">
      <div 
        className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[3/1]"
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
                className="w-full h-full object-contain sm:object-cover object-center"
                loading={index === 0 ? "eager" : "lazy"}
              />
              {/* Minimal overlay - only at bottom for button visibility */}
              <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-foreground/50 to-transparent" />
              
              {/* Minimal content - just shop button */}
              <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6">
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

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prevSlide(); }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card active:bg-card/90 transition-smooth z-20"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); nextSlide(); }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card active:bg-card/90 transition-smooth z-20"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
            </button>

            {/* Dots - larger touch targets on mobile */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.preventDefault(); goToSlide(index); }}
                  className={`rounded-full transition-all duration-300 min-w-[24px] min-h-[24px] sm:min-w-[20px] sm:min-h-[20px] flex items-center justify-center ${
                    index === currentSlide
                      ? "bg-primary"
                      : "bg-card/60 hover:bg-card"
                  }`}
                >
                  <span className={`rounded-full ${
                    index === currentSlide
                      ? "bg-primary w-6 sm:w-8 h-2"
                      : "bg-card/80 w-2 h-2"
                  }`} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Hero;
