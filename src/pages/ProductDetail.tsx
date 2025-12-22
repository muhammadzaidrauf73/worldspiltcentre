import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewForm from "@/components/ReviewForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Truck, 
  Shield, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ZoomIn,
  ChevronDown
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { toggleWishlist, isInWishlist, isToggling } = useWishlist();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Touch handling for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const initialPinchDistance = useRef<number | null>(null);
  const lastScale = useRef(1);
  const isPinching = useRef(false);
  const minSwipeDistance = 50;

  const getDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      initialPinchDistance.current = getDistance(e.touches);
      lastScale.current = scale;
    } else if (e.touches.length === 1 && scale === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance.current) {
      const currentDistance = getDistance(e.touches);
      const newScale = Math.min(Math.max(lastScale.current * (currentDistance / initialPinchDistance.current), 1), 4);
      setScale(newScale);
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        // Pan when zoomed
        const touch = e.touches[0];
        const deltaX = touch.clientX - (touchStartX.current || touch.clientX);
        const deltaY = touch.clientY - (touchEndX.current || touch.clientY);
        setPosition(prev => ({
          x: prev.x + deltaX * 0.5,
          y: prev.y + deltaY * 0.5
        }));
      } else {
        touchEndX.current = e.touches[0].clientX;
      }
    }
  };

  const handleTouchEnd = (imagesLength: number) => {
    if (isPinching.current) {
      isPinching.current = false;
      initialPinchDistance.current = null;
      return;
    }
    
    if (scale > 1) {
      touchStartX.current = null;
      touchEndX.current = null;
      return;
    }
    
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setSelectedImage(prev => Math.min(imagesLength - 1, prev + 1));
    } else if (isRightSwipe) {
      setSelectedImage(prev => Math.max(0, prev - 1));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Reset zoom when image changes or fullscreen closes
  const handleFullscreenChange = (open: boolean) => {
    setIsFullscreen(open);
    if (!open) {
      resetZoom();
    }
  };
  
  const inWishlist = id ? isInWishlist(id) : false;

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", id)
        .eq("is_approved", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const galleryImages = (product?.gallery_images ?? []).filter(
    (img): img is string => typeof img === "string" && img.trim().length > 0
  );

  const images = galleryImages.length
    ? galleryImages
    : product?.image_url
      ? [product.image_url]
      : [];

  const specifications = product?.specifications as Record<string, string> || {};

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    setAddingToCart(true);

    const { error } = await supabase
      .from("cart_items")
      .upsert({
        user_id: user.id,
        product_id: id,
        quantity,
      }, {
        onConflict: "user_id,product_id",
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } else {
      // Invalidate cart count to update the navbar badge
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast({
        title: "Added to cart",
        description: `${product?.name} has been added to your cart.`,
      });
    }

    setAddingToCart(false);
  };

  const discount = product?.original_price 
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product not found</h1>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${product.name} - ${product.brand}`}
        description={product.description || `Buy ${product.name} by ${product.brand} at best price. ${product.categories?.name || 'Electronics'} available at World Spilt Centre Lahore.`}
        keywords={`${product.name}, ${product.brand}, ${product.categories?.name || ''}, buy ${product.brand} pakistan, electronics lahore`}
        image={product.image_url || undefined}
        type="product"
      />
      <Navbar />
      
      {/* Mobile: Full-width image section with swipe */}
      <div className="md:hidden">
        <div 
          className="relative w-full aspect-[4/3] bg-secondary/30"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => handleTouchEnd(images.length)}
        >
          {discount > 0 && (
            <Badge className="absolute top-3 left-3 z-10 bg-deal text-deal-foreground text-xs">
              {discount}% OFF
            </Badge>
          )}
          
          {/* Top right buttons - Wishlist and Zoom */}
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button
              onClick={() => id && toggleWishlist(id)}
              disabled={isToggling}
              className={cn(
                "w-8 h-8 rounded-full bg-card/80 flex items-center justify-center",
                inWishlist && "bg-primary/20"
              )}
            >
              <Heart className={cn("h-4 w-4", inWishlist && "fill-primary text-primary")} />
            </button>
            <button
              onClick={() => setIsFullscreen(true)}
              className="w-8 h-8 rounded-full bg-card/80 flex items-center justify-center"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          
          <img
            src={images[selectedImage] || "/placeholder.svg"}
            alt={product.name}
            onClick={() => setIsFullscreen(true)}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
            className="w-full h-full object-contain p-4 cursor-pointer"
          />
          
          {/* Image counter dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    selectedImage === idx 
                      ? "bg-primary w-4" 
                      : "bg-card/60"
                  }`}
                />
              ))}
            </div>
          )}
          
          {images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center"
                disabled={selectedImage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedImage(prev => Math.min(images.length - 1, prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center"
                disabled={selectedImage === images.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        
        {/* Mobile Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-background">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`shrink-0 w-16 h-16 rounded-md border-2 overflow-hidden bg-secondary/30 transition-all ${
                  selectedImage === idx 
                    ? "border-primary ring-1 ring-primary" 
                    : "border-border"
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} view ${idx + 1}`}
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                  className="w-full h-full object-contain p-1"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Image Viewer with Pinch-to-Zoom */}
      <Dialog open={isFullscreen} onOpenChange={handleFullscreenChange}>
        <DialogContent className="max-w-full h-full p-0 bg-black/95 border-none">
          <div 
            className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => handleTouchEnd(images.length)}
          >
            <button
              onClick={() => handleFullscreenChange(false)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-card/20 flex items-center justify-center text-white"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Reset zoom button - show when zoomed */}
            {scale > 1 && (
              <button
                onClick={resetZoom}
                className="absolute top-4 left-4 z-20 px-3 py-2 rounded-full bg-card/20 flex items-center justify-center text-white text-sm"
              >
                Reset
              </button>
            )}
            
            <img
              src={images[selectedImage] || "/placeholder.svg"}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
              onDoubleClick={() => scale > 1 ? resetZoom() : setScale(2)}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isPinching.current ? 'none' : 'transform 0.2s ease-out'
              }}
              className="max-w-full max-h-full object-contain p-4 select-none"
              draggable={false}
            />
            
            {images.length > 1 && scale === 1 && (
              <>
                <button
                  onClick={() => { resetZoom(); setSelectedImage(prev => Math.max(0, prev - 1)); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/20 flex items-center justify-center text-white"
                  disabled={selectedImage === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => { resetZoom(); setSelectedImage(prev => Math.min(images.length - 1, prev + 1)); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/20 flex items-center justify-center text-white"
                  disabled={selectedImage === images.length - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* Counter and zoom indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {selectedImage + 1} / {images.length}
              </div>
              {scale > 1 && (
                <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  {Math.round(scale * 100)}%
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary">Products</Link>
          {product.categories && (
            <>
              <span>/</span>
              <Link to={`/products?category=${product.categories.slug}`} className="hover:text-primary">
                {product.categories.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
          {/* Image Gallery - Desktop only */}
          <div className="hidden md:block space-y-4">
            <div className="relative aspect-square bg-secondary/30 rounded-lg overflow-hidden">
              {discount > 0 && (
                <Badge className="absolute top-4 left-4 z-10 bg-deal text-deal-foreground text-xs">
                  {discount}% OFF
                </Badge>
              )}
              
              {/* Wishlist button - Desktop */}
              <button
                onClick={() => id && toggleWishlist(id)}
                disabled={isToggling}
                className={cn(
                  "absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-card/80 flex items-center justify-center hover:bg-card transition-colors",
                  inWishlist && "bg-primary/20"
                )}
              >
                <Heart className={cn("h-5 w-5", inWishlist && "fill-primary text-primary")} />
              </button>
              
              <img
                src={images[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
                className="w-full h-full object-contain p-8"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 flex items-center justify-center hover:bg-card"
                    disabled={selectedImage === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => Math.min(images.length - 1, prev + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 flex items-center justify-center hover:bg-card"
                    disabled={selectedImage === images.length - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            
            {/* Desktop Thumbnail Gallery */}
            {images.length >= 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden bg-secondary/30 transition-all ${
                      selectedImage === idx 
                        ? "border-primary ring-1 ring-primary" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">{product.brand}</p>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              {product.name}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(Number(product.rating))
                        ? "fill-primary text-primary"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {Number(product.rating).toFixed(1)} ({product.reviews_count} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                Rs.{Number(product.price).toLocaleString()}
              </span>
              {product.original_price && (
                <span className="text-lg text-muted-foreground line-through">
                  Rs.{Number(product.original_price).toLocaleString()}
                </span>
              )}
              {discount > 0 && (
                <Badge variant="secondary" className="bg-accent/10 text-accent">
                  Save Rs.{(Number(product.original_price) - Number(product.price)).toLocaleString()}
                </Badge>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock_quantity > 0 ? (
                <>
                  <Check className="h-4 w-4 text-accent" />
                  <span className="text-accent font-medium">In Stock</span>
                  <span className="text-muted-foreground text-sm">
                    ({product.stock_quantity} available)
                  </span>
                </>
              ) : (
                <span className="text-destructive font-medium">Out of Stock</span>
              )}
            </div>

            {/* Free Delivery Badge */}
            {product.is_free_delivery && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
                <Truck className="h-5 w-5" />
                <div>
                  <span className="font-semibold">Free Delivery</span>
                  <p className="text-sm text-green-600 dark:text-green-500">This product qualifies for free shipping</p>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-muted-foreground">{product.description}</p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Color:</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all shadow-sm hover:scale-110 ${
                        selectedColor === color
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                {selectedColor && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedColor}
                  </p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-2 hover:bg-secondary"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                  className="p-2 hover:bg-secondary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock_quantity === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onClick={async () => {
                  await handleAddToCart();
                  if (user) {
                    window.location.href = '/checkout';
                  }
                }}
                disabled={addingToCart || product.stock_quantity === 0}
              >
                Buy Now
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-5 w-5 text-primary" />
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-5 w-5 text-primary" />
                <span>Warranty</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="h-5 w-5 text-primary" />
                <span>7 Day Return</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {Object.keys(specifications).length > 0 && (
          <div className="mb-8 md:mb-12">
            <h2 className="text-lg md:text-xl font-heading font-bold text-foreground mb-3 md:mb-4">
              Specifications
            </h2>
            {/* Mobile: Collapsible layout */}
            <Collapsible className="md:hidden">
              <CollapsibleTrigger className="w-full bg-card rounded-lg border border-border p-3 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <span className="text-sm font-medium text-foreground">
                  View all {Object.keys(specifications).length} specifications
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-card rounded-lg border border-border overflow-hidden max-h-[350px] overflow-y-auto">
                  <div className="divide-y divide-border">
                    {Object.entries(specifications).map(([key, value], idx) => (
                      <div key={key} className={`p-3 ${idx % 2 === 0 ? "bg-secondary/30" : ""}`}>
                        <dt className="text-xs font-medium text-foreground mb-1">{key}</dt>
                        <dd className="text-xs text-muted-foreground break-words">{value}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            {/* Desktop: Table layout */}
            <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(specifications).map(([key, value], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? "bg-secondary/30" : ""}>
                      <td className="px-4 py-3 font-medium text-foreground w-1/3">{key}</td>
                      <td className="px-4 py-3 text-muted-foreground">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mb-12">
          <h2 className="text-xl font-heading font-bold text-foreground mb-6">
            Customer Reviews ({reviews.length})
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Review Form */}
            <div className="lg:col-span-1">
              <ReviewForm productId={id!} />
            </div>
            
            {/* Reviews List */}
            <div className="lg:col-span-2">
              {reviews.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-8 text-center h-full flex flex-col items-center justify-center">
                  <Star className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="font-medium text-foreground mb-1">No reviews yet</p>
                  <p className="text-sm text-muted-foreground">Be the first to review this product!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="bg-card rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold">
                              {(review.reviewer_name || "A")[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground">
                                {review.reviewer_name || "Customer"}
                              </span>
                              {review.is_verified_purchase && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Verified Purchase
                                </span>
                              )}
                              {review.is_featured && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  Featured
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {review.reviewer_location && (
                                <span>{review.reviewer_location}, Pakistan</span>
                              )}
                              <span>•</span>
                              <span>{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-primary text-primary"
                                  : "fill-muted text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {review.title && (
                        <h4 className="font-semibold text-foreground mb-2">{review.title}</h4>
                      )}
                      
                      {review.comment && (
                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                      )}
                      
                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-3">
                          {review.images.map((img: string, idx: number) => (
                            <a
                              key={idx}
                              href={img}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-20 h-20 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                            >
                              <img
                                src={img}
                                alt={`Review image ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg";
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProductDetail;
