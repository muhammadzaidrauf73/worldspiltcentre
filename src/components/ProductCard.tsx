import { Heart, ShoppingCart, Star, Eye, ShoppingBag, MessageCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { HighlightText } from "@/lib/highlight-text";
import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  isFreeDelivery?: boolean;
  index?: number;
  hideQuickActions?: boolean;
  buttonText?: string;
  searchHighlight?: string;
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
  isFreeDelivery,
  index = 0,
  hideQuickActions = false,
  buttonText = "Add to Cart",
  searchHighlight = "",
}: ProductCardProps) => {
  const { toggleWishlist, isInWishlist, isToggling } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const inWishlist = isInWishlist(id);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingOnly, setIsAddingOnly] = useState(false);
  
  // Only show discount if original price is higher than current price
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    
    toggleWishlist(id);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to add items to cart",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsAddingOnly(true);
    try {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .maybeSingle();

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);
      } else {
        await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: id, quantity: 1 });
      }

      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      
      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingOnly(false);
    }
  };

  const handleShopNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to add items to cart",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsAddingToCart(true);
    try {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .maybeSingle();

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);
      } else {
        await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: id, quantity: 1 });
      }

      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      
      navigate("/checkout");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
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

      {/* Badge (for other labels) - with animated glow for flash deals */}
      {badge && !isOnSale && (
        <Badge 
          className={cn(
            "absolute top-2 left-2 z-10 text-[10px] sm:text-xs font-bold px-2 py-0.5",
            badge.includes("Flash") 
              ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg animate-[glow_1.5s_ease-in-out_infinite] border border-amber-400/50"
              : "bg-deal text-deal-foreground"
          )}
        >
          {badge}
        </Badge>
      )}

      {/* Discount Badge - moved to left if no sale badge */}
      {discount > 0 && (
        <Badge className={cn(
          "absolute top-2 z-10 bg-deal text-deal-foreground text-[10px] sm:text-xs font-bold px-1.5 py-0.5",
          isOnSale || badge ? "right-2" : "right-2"
        )}>
          {discount}% OFF
        </Badge>
      )}

      {/* Wishlist Button - Always visible on top right of image */}
      {!hideQuickActions && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleWishlistClick}
          disabled={isToggling}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute top-2 z-20 h-8 w-8 sm:h-9 sm:w-9 bg-card/90 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground rounded-full transition-all duration-200",
            discount > 0 ? "right-16 sm:right-[4.5rem]" : "right-2",
            inWishlist && "bg-primary text-primary-foreground"
          )}
        >
          <Heart 
            className={cn(
              "h-4 w-4 transition-all duration-200",
              inWishlist && "fill-current",
              isAnimating && "animate-heart-burst"
            )} 
          />
        </Button>
      )}

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
          <HighlightText text={brand} highlight={searchHighlight} />
        </p>
        <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-smooth min-h-[2.5rem] sm:min-h-[3rem] leading-snug">
          <HighlightText text={name} highlight={searchHighlight} />
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
          {price > 0 ? (
            <>
              <span className="font-bold text-base sm:text-lg text-primary">
                Rs.{price.toLocaleString()}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-xs sm:text-sm text-muted-foreground line-through">
                  Rs.{originalPrice.toLocaleString()}
                </span>
              )}
            </>
          ) : (
            <span className="font-semibold text-sm sm:text-base text-green-600">
              Contact for Price
            </span>
          )}
        </div>

        {/* Free Delivery Badge */}
        {isFreeDelivery && (
          <div className="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-md w-fit">
            <Truck className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Free Delivery</span>
          </div>
        )}

        {/* Action Buttons - Add to Cart + Buy Now */}
        {price > 0 ? (
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1.5 mt-2 sm:mt-3">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              disabled={isAddingOnly || isAddingToCart}
              className="h-9 text-xs font-medium rounded-md touch-manipulation transition-all duration-200 px-3 w-full"
            >
              {isAddingOnly ? (
                <div className="h-3.5 w-3.5 mr-1.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              )}
              {isAddingOnly ? "Adding..." : "Add to Cart"}
            </Button>
            <Button 
              size="sm"
              onClick={handleShopNow}
              disabled={isAddingToCart || isAddingOnly}
              className="h-9 text-xs font-medium bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground rounded-md touch-manipulation transition-all duration-200 px-3 w-full"
            >
              {isAddingToCart ? (
                <div className="h-3.5 w-3.5 mr-1.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin flex-shrink-0" />
              ) : (
                <ShoppingBag className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              )}
              {isAddingToCart ? "Processing..." : "Buy Now"}
            </Button>
          </div>
        ) : (
          <a
            href={`https://wa.me/923004649141?text=${encodeURIComponent(`Hi, I'm interested in getting the latest price for: ${name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block"
          >
            <Button 
              className="w-full mt-2 sm:mt-3 h-11 sm:h-10 text-sm font-semibold bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg touch-manipulation transition-all duration-300"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp for Price
            </Button>
          </a>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
