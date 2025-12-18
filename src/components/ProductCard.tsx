import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
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
      className="group relative bg-card rounded-lg border border-border overflow-hidden shadow-card hover:shadow-lg transition-smooth animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Badge */}
      {badge && (
        <Badge className="absolute top-2 left-2 z-10 bg-deal text-deal-foreground text-xs font-bold">
          {badge}
        </Badge>
      )}

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-smooth translate-x-2 group-hover:translate-x-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-card shadow-sm hover:bg-primary hover:text-primary-foreground"
        >
          <Heart className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-card shadow-sm hover:bg-primary hover:text-primary-foreground"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-secondary/30 overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-smooth"
        />
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {brand}
        </p>
        <h3 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-smooth min-h-[2.5rem]">
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
                    ? "fill-primary text-primary"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">({reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <span className="font-bold text-base text-primary">
            Rs.{price.toLocaleString()}
          </span>
          {originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              Rs.{originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {discount > 0 && (
          <Badge variant="secondary" className="bg-accent/10 text-accent text-[10px] font-medium">
            Save {discount}%
          </Badge>
        )}

        {/* Add to Cart */}
        <Button className="w-full mt-2 h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground">
          <ShoppingCart className="h-4 w-4 mr-1.5" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
