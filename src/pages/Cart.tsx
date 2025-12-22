import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Sparkles, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Confetti component for celebration effect
const Confetti = () => {
  const colors = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b', '#3b82f6', '#8b5cf6'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    size: 6 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: piece.id % 3 === 0 ? '50%' : '2px',
            transform: `rotate(${piece.rotation}deg)`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

const Cart = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfetti, setShowConfetti] = useState(false);
  const hasShownConfetti = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, products(*)")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("id", itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
  });

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (Number(item.products?.price) || 0) * item.quantity;
  }, 0);

  // Check if any product qualifies for free delivery
  const anyProductQualifiesForFreeDelivery = cartItems.some(
    item => item.products?.is_free_delivery === true
  );
  
  // Get the free delivery product names for display
  const freeDeliveryProducts = cartItems
    .filter(item => item.products?.is_free_delivery === true)
    .map(item => item.products?.name);

  const shipping = anyProductQualifiesForFreeDelivery ? 0 : (subtotal > 10000 ? 0 : 500);

  // Trigger confetti when free delivery is unlocked
  useEffect(() => {
    if (anyProductQualifiesForFreeDelivery && !hasShownConfetti.current && cartItems.length > 0) {
      hasShownConfetti.current = true;
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [anyProductQualifiesForFreeDelivery, cartItems.length]);
  const total = subtotal + shipping;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
    await queryClient.invalidateQueries({ queryKey: ["cart-count"] });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {showConfetti && <Confetti />}
      <div className="min-h-screen bg-background">
        <SEO 
          title="Shopping Cart - World Spilt Centre"
          description="Review your cart and checkout. Free delivery on orders above threshold. Secure payment options available."
          keywords="shopping cart, checkout, buy electronics lahore, online shopping pakistan"
        />
        <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-6">
          Shopping Cart
        </h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/products">
              <Button className="bg-primary hover:bg-primary/90">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Free Delivery Banner */}
              {anyProductQualifiesForFreeDelivery && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/40 border border-emerald-200/60 dark:border-emerald-800/40 p-5 animate-fade-in shadow-sm">
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/40 to-transparent dark:from-emerald-700/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-200/40 to-transparent dark:from-teal-700/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative flex items-center gap-4">
                    {/* Icon with animated ring */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 rounded-full bg-emerald-400/30 dark:bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Truck className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                          Free Delivery Unlocked!
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                          <Sparkles className="h-3 w-3" />
                          BONUS
                        </span>
                      </div>
                      <p className="text-sm text-emerald-700/80 dark:text-emerald-300/70 mt-1 leading-relaxed">
                        Your cart includes{" "}
                        <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                          {freeDeliveryProducts.length === 1 
                            ? freeDeliveryProducts[0] 
                            : `${freeDeliveryProducts.length} eligible products`}
                        </span>
                        {" "}— <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE shipping</span> on your entire order!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-card rounded-lg border border-border p-4 flex gap-4"
                >
                  <Link to={`/product/${item.product_id}`} className="shrink-0">
                    <div className="w-24 h-24 rounded-lg bg-secondary/30 overflow-hidden">
                      <img
                        src={item.products?.image_url || "/placeholder.svg"}
                        alt={item.products?.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product_id}`}>
                      <h3 className="font-medium text-foreground hover:text-primary line-clamp-2">
                        {item.products?.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <p className="text-sm text-muted-foreground">{item.products?.brand}</p>
                      {item.products?.is_free_delivery && (
                        <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-0 text-[10px] px-1.5 py-0 h-5 gap-1">
                          <Truck className="h-3 w-3" />
                          Free Delivery
                        </Badge>
                      )}
                    </div>
                    <p className="font-bold text-primary mt-1">
                      Rs.{Number(item.products?.price).toLocaleString()}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border rounded">
                        <button
                          onClick={() => updateQuantityMutation.mutate({ 
                            itemId: item.id, 
                            quantity: item.quantity - 1 
                          })}
                          className="p-1.5 hover:bg-secondary"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantityMutation.mutate({ 
                            itemId: item.id, 
                            quantity: item.quantity + 1 
                          })}
                          className="p-1.5 hover:bg-secondary"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeItemMutation.mutate(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
                <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                    <span className="font-medium">Rs.{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-accent">FREE</span>
                      ) : (
                        `Rs.${shipping}`
                      )}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Free shipping on orders over Rs.10,000
                    </p>
                  )}
                  <div className="border-t border-border pt-3 flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">Rs.{total.toLocaleString()}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6 bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                <Link to="/products">
                  <Button variant="outline" className="w-full mt-3">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      
        <Footer />
      </div>
    </PullToRefresh>
  );
};

export default Cart;
