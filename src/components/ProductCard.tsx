import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div
      className="group relative bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-lg transition-smooth animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Badge */}
      {badge && (
        <Badge className="absolute top-3 left-3 z-10 bg-deal text-deal-foreground font-bold">
          {badge}
        </Badge>
      )}

      {/* Wishlist Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 z-10 bg-card/80 backdrop-blur hover:bg-card opacity-0 group-hover:opacity-100 transition-smooth"
      >
        <Heart className="h-4 w-4" />
      </Button>

      {/* Image */}
      <div className="relative aspect-square bg-secondary/30 overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-smooth"
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {brand}
        </p>
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-smooth min-h-[2.5rem]">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(rating)
                    ? "fill-accent text-accent"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <span className="font-bold text-lg text-foreground">
            ${price.toLocaleString()}
          </span>
          {originalPrice && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                ${originalPrice.toLocaleString()}
              </span>
              <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                -{discount}%
              </Badge>
            </>
          )}
        </div>

        {/* Add to Cart */}
        <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
