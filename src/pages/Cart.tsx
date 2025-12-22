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
import { Minus, Plus, Trash2, ShoppingBag, Truck } from "lucide-react";

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

  // Fetch active flash deals to apply deal prices
  const { data: activeFlashDeals = [] } = useQuery({
    queryKey: ["flash-deals-active-cart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flash_deals")
        .select("product_id, deal_price, original_price")
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString());
      if (error) throw error;
      return data;
    },
  });

  // Helper function to get effective price (flash deal price if applicable)
  const getEffectivePrice = (item: any) => {
    const flashDeal = activeFlashDeals.find(d => d.product_id === item.product_id);
    if (flashDeal) {
      return Number(flashDeal.deal_price);
    }
    return Number(item.products?.price) || 0;
  };

  // Helper to check if item has flash deal
  const hasFlashDeal = (item: any) => {
    return activeFlashDeals.some(d => d.product_id === item.product_id);
  };

  // Get original price for flash deal display
  const getOriginalPrice = (item: any) => {
    const flashDeal = activeFlashDeals.find(d => d.product_id === item.product_id);
    if (flashDeal) {
      return Number(flashDeal.original_price);
    }
    return Number(item.products?.original_price) || null;
  };

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

  // Calculate total flash deal savings
  const flashDealSavings = cartItems.reduce((sum, item) => {
    const flashDeal = activeFlashDeals.find(d => d.product_id === item.product_id);
    if (flashDeal) {
      const originalPrice = Number(flashDeal.original_price);
      const dealPrice = Number(flashDeal.deal_price);
      return sum + (originalPrice - dealPrice) * item.quantity;
    }
    return sum;
  }, 0);

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + getEffectivePrice(item) * item.quantity;
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
      <div className="min-h-screen bg-secondary/30">
        <SEO 
          title="Shopping Cart - World Spilt Centre"
          description="Review your cart and checkout. Free delivery on orders above threshold."
          keywords="shopping cart, checkout, buy electronics lahore"
        />
        <Navbar />
      
        <div className="container mx-auto px-4 py-4 sm:py-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Shopping Cart</h1>
            {cartItems.length > 0 && (
              <span className="text-sm text-muted-foreground">({cartItems.length} items)</span>
            )}
          </div>
          
          {cartItems.length === 0 ? (
            <div className="bg-card rounded p-8 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h2 className="text-base font-semibold text-foreground mb-1">Your cart is empty</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Start shopping to add items to your cart
              </p>
              <Link to="/products">
                <Button size="sm">Continue Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3">
                {/* Free Delivery Banner - Compact */}
                {anyProductQualifiesForFreeDelivery && (
                  <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/30 rounded">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <Truck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-accent">Free Delivery Unlocked!</p>
                      <p className="text-xs text-muted-foreground">
                        Your order qualifies for free shipping
                      </p>
                    </div>
                  </div>
                )}

                {/* Products Card */}
                <div className="bg-card rounded p-4">
                  <div className="divide-y divide-border">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                        <Link to={`/product/${item.product_id}`} className="shrink-0">
                          <div className="w-16 h-16 rounded border border-border bg-white overflow-hidden">
                            <img
                              src={item.products?.image_url || "/placeholder.svg"}
                              alt={item.products?.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                        </Link>
                        
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${item.product_id}`}>
                            <p className="text-sm line-clamp-2 hover:text-primary">
                              {item.products?.name}
                            </p>
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{item.products?.brand}</span>
                            {hasFlashDeal(item) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-deal/10 text-deal font-medium">
                                ⚡ Flash Deal
                              </span>
                            )}
                            {item.products?.is_free_delivery && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                                Free Delivery
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div>
                              <p className="text-sm font-bold text-primary">
                                Rs.{getEffectivePrice(item).toLocaleString()}
                              </p>
                              {(hasFlashDeal(item) || getOriginalPrice(item)) && (
                                <p className="text-xs text-muted-foreground line-through">
                                  Rs.{(getOriginalPrice(item) || Number(item.products?.price)).toLocaleString()}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex items-center border border-border rounded">
                                <button
                                  onClick={() => updateQuantityMutation.mutate({ 
                                    itemId: item.id, 
                                    quantity: item.quantity - 1 
                                  })}
                                  className="p-1 hover:bg-secondary"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-2.5 text-xs font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantityMutation.mutate({ 
                                    itemId: item.id, 
                                    quantity: item.quantity + 1 
                                  })}
                                  className="p-1 hover:bg-secondary"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              
                              <button
                                onClick={() => removeItemMutation.mutate(item.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded p-4 sticky top-20">
                  {/* Free Delivery Progress */}
                  {!anyProductQualifiesForFreeDelivery && subtotal < 10000 && (
                    <div className="mb-4 p-3 rounded bg-secondary/50 border border-border">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">Free delivery progress</span>
                        <span className="font-medium">{Math.round((subtotal / 10000) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-accent rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((subtotal / 10000) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add Rs.{(10000 - subtotal).toLocaleString()} more for free shipping
                      </p>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                      <span>Rs.{subtotal.toLocaleString()}</span>
                    </div>
                    {flashDealSavings > 0 && (
                      <div className="flex justify-between text-deal">
                        <span className="flex items-center gap-1">
                          ⚡ Flash Deal Savings
                        </span>
                        <span className="font-medium">-Rs.{flashDealSavings.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={shipping === 0 ? 'text-accent font-medium' : ''}>
                        {shipping === 0 ? "FREE" : `Rs.${shipping}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between py-3 mt-2 border-t border-border">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">Rs.{total.toLocaleString()}</span>
                  </div>
                  
                  <Button 
                    className="w-full h-10 font-semibold"
                    onClick={() => navigate("/checkout")}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Link to="/products" className="block mt-2">
                    <Button variant="outline" size="sm" className="w-full">
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
