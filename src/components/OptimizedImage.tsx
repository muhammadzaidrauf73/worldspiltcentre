import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

// Generate srcset for responsive images
const generateSrcSet = (src: string): string => {
  // If it's already a data URL or placeholder, don't generate srcset
  if (src.startsWith("data:") || src.includes("placeholder")) {
    return "";
  }
  
  // For Supabase storage URLs, we can add transform parameters
  if (src.includes("supabase")) {
    const widths = [320, 480, 640, 768, 1024, 1280];
    return widths
      .map((w) => {
        const url = new URL(src);
        url.searchParams.set("width", w.toString());
        url.searchParams.set("quality", "80");
        return `${url.toString()} ${w}w`;
      })
      .join(", ");
  }
  
  return "";
};

const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  objectFit = "cover",
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before entering viewport
        threshold: 0,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const srcSet = generateSrcSet(src);
  const objectFitClass = {
    contain: "object-contain",
    cover: "object-cover",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
  }[objectFit];

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-secondary/30",
        className
      )}
      style={{ width, height }}
    >
      {/* Placeholder/skeleton while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-secondary/50 animate-pulse" />
      )}
      
      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          srcSet={srcSet || undefined}
          sizes={srcSet ? sizes : undefined}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "w-full h-full transition-opacity duration-300",
            objectFitClass,
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
