import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { memo, useState } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  badge?: string;
  isOnSale?: boolean;
  index?: number;
}

const ProductCard = memo(({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  badge,
  isOnSale,
  index = 0,
}: ProductCardProps) => {
  const { toggleWishlist, isInWishlist, isToggling } = useWishlist();
  const inWishlist = isInWishlist(id);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Only show discount if original price is higher than current price
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id);
  };

  return (
    <div
      className="group relative bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-lg transition-smooth animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.2)}s` }}
    >
      {/* Sale Badge - Circular */}
      {isOnSale && (
        <div className="absolute top-2 left-2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-destructive rounded-full flex items-center justify-center shadow-lg">
          <span className="text-destructive-foreground text-[9px] sm:text-[10px] font-bold uppercase tracking-tight">
            SALE
          </span>
        </div>
      )}

      {/* Badge (for other labels) */}
      {badge && !isOnSale && (
        <Badge className="absolute top-2 left-2 z-10 bg-deal text-deal-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5">
          {badge}
        </Badge>
      )}

      {/* Discount Badge */}
      {discount > 0 && (
        <Badge className="absolute top-2 right-2 z-10 bg-deal text-deal-foreground text-[10px] sm:text-xs font-bold px-1.5 py-0.5">
          {discount}% OFF
        </Badge>
      )}

      {/* Action Buttons - Hidden on mobile, shown on hover for desktop */}
      <div className="absolute top-10 right-2 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-smooth translate-x-2 group-hover:translate-x-0 hidden sm:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleWishlistClick}
          disabled={isToggling}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "h-9 w-9 bg-card shadow-md hover:bg-primary hover:text-primary-foreground rounded-full",
            inWishlist && "bg-primary text-primary-foreground"
          )}
        >
          <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Quick view product"
          className="h-9 w-9 bg-card shadow-md hover:bg-primary hover:text-primary-foreground rounded-full"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Image - Larger on mobile for better visibility */}
      <div className="relative aspect-square sm:aspect-square bg-secondary/30 overflow-hidden">
        {/* Skeleton placeholder - show until loaded or error */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-secondary/50 animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            setImageError(true);
            setImageLoaded(true);
            e.currentTarget.src = "/placeholder.svg";
          }}
          className={cn(
            "w-full h-full object-contain p-2 group-hover:scale-110 transition-smooth",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
        <p className="text-xs sm:text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          {brand}
        </p>
        <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-smooth min-h-[2.5rem] sm:min-h-[3rem] leading-snug">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                  i < Math.floor(rating)
                    ? "fill-primary text-primary"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground">({reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-bold text-base sm:text-lg text-primary">
            Rs.{price.toLocaleString()}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs sm:text-sm text-muted-foreground line-through">
              Rs.{originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to Cart - Touch-friendly */}
        <Button className="w-full mt-2 sm:mt-3 h-11 sm:h-10 text-sm font-semibold bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground rounded-lg touch-manipulation">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>

        {/* Mobile Quick Actions - Full width stacked */}
        <div className="grid grid-cols-2 gap-2 sm:hidden mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWishlistClick}
            disabled={isToggling}
            className={cn(
              "h-9 text-xs font-medium rounded-lg touch-manipulation px-2",
              inWishlist && "bg-primary/10 border-primary text-primary"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5 mr-1", inWishlist && "fill-primary")} />
            <span className="truncate">{inWishlist ? "Saved" : "Wishlist"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs font-medium rounded-lg touch-manipulation px-2"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            <span className="truncate">Quick View</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
