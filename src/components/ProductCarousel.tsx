import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  discount_percentage?: number | null;
}

interface ProductCarouselProps {
  products: Product[];
  badge?: string;
  hideQuickActions?: boolean;
}

const ProductCarousel = ({ products, badge, hideQuickActions = true }: ProductCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll);
      return () => ref.removeEventListener("scroll", checkScroll);
    }
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.querySelector("a")?.offsetWidth || 200;
      const scrollAmount = cardWidth * 2;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group/carousel">
      {/* Navigation Arrows - Hidden on mobile */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll("left")}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card/90 shadow-md border border-border hidden sm:flex",
          "opacity-0 group-hover/carousel:opacity-100 transition-opacity",
          !canScrollLeft && "!opacity-0 pointer-events-none"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll("right")}
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card/90 shadow-md border border-border hidden sm:flex",
          "opacity-0 group-hover/carousel:opacity-100 transition-opacity",
          !canScrollRight && "!opacity-0 pointer-events-none"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth scrollbar-hide"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {products.map((product, index) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className="shrink-0 w-[45%] sm:w-[32%] md:w-[24%] lg:w-[19%]"
          >
            <ProductCard
              id={product.id}
              name={product.name}
              brand={product.brand}
              price={Number(product.price)}
              originalPrice={product.original_price ? Number(product.original_price) : undefined}
              image={product.image_url || "/placeholder.svg"}
              rating={Number(product.rating) || 0}
              reviews={product.reviews_count || 0}
              badge={badge || (product.discount_percentage ? `${product.discount_percentage}% OFF` : undefined)}
              index={index}
              hideQuickActions={hideQuickActions}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
