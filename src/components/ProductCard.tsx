import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

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
  index?: number;
}

const ProductCard = ({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  badge,
  index = 0,
}: ProductCardProps) => {
  const { toggleWishlist, isInWishlist, isToggling } = useWishlist();
  const inWishlist = isInWishlist(id);
  
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
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Badge */}
      {badge && (
        <Badge className="absolute top-2 left-2 z-10 bg-deal text-deal-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5">
          {badge}
        </Badge>
      )}

      {/* Discount Badge - Mobile visible */}
      {discount > 0 && (
        <Badge className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold px-1.5 py-0.5">
          -{discount}%
        </Badge>
      )}

      {/* Action Buttons - Hidden on mobile, shown on hover for desktop */}
      <div className="absolute top-10 right-2 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-smooth translate-x-2 group-hover:translate-x-0 hidden sm:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleWishlistClick}
          disabled={isToggling}
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
          className="h-9 w-9 bg-card shadow-md hover:bg-primary hover:text-primary-foreground rounded-full"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Image - Taller on mobile for better visibility */}
      <div className="relative aspect-[4/3] sm:aspect-square bg-secondary/30 overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
          className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-105 transition-smooth"
        />
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {brand}
        </p>
        <h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-smooth min-h-[2.5rem] sm:min-h-[3rem] leading-tight">
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

        {/* Mobile Quick Actions */}
        <div className="flex gap-2 sm:hidden mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWishlistClick}
            disabled={isToggling}
            className={cn(
              "flex-1 h-10 text-xs font-medium rounded-lg touch-manipulation",
              inWishlist && "bg-primary/10 border-primary text-primary"
            )}
          >
            <Heart className={cn("h-4 w-4 mr-1.5", inWishlist && "fill-primary")} />
            {inWishlist ? "Saved" : "Wishlist"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10 text-xs font-medium rounded-lg touch-manipulation"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Quick View
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

