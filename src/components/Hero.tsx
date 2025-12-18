import { useState, useEffect } from "react";
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

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px]">
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
                className="w-full h-full object-cover object-center sm:object-center"
              />
              {/* Overlay for text readability - stronger on mobile, bottom gradient for mobile text */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent sm:bg-gradient-to-r sm:from-foreground/40 sm:via-transparent sm:to-transparent" />
              
              {/* Content overlay - only show if there's text content */}
              {(banner.subtitle || banner.description) && (
                <div className="absolute inset-0 flex items-end pb-12 sm:items-center sm:pb-0">
                  <div className="container mx-auto px-4">
                    <div className="max-w-xs sm:max-w-md md:max-w-lg text-card">
                      {banner.subtitle && (
                        <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold mb-2 sm:mb-4">
                          {banner.subtitle}
                        </span>
                      )}
                      {banner.description && (
                        <p className="text-card/90 text-sm sm:text-base md:text-lg mb-3 sm:mb-6 line-clamp-2 sm:line-clamp-none">
                          {banner.description}
                        </p>
                      )}
                      <Button 
                        className="font-semibold px-4 sm:px-6 text-sm sm:text-base text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: banner.button_color || '#f97316' }}
                      >
                        Shop Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prevSlide(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-smooth z-20"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); nextSlide(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-smooth z-20"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 sm:gap-2 z-20">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.preventDefault(); goToSlide(index); }}
                  className={`h-3 sm:h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-primary w-10 sm:w-8"
                      : "bg-card/60 hover:bg-card w-3 sm:w-2.5"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Hero;
