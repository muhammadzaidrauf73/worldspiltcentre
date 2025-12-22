import { useEffect } from "react";
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
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Sparkles } from "lucide-react";

const Cart = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
                <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-4 animate-fade-in">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-green-700 dark:text-green-400">
                        🎉 Free Delivery Unlocked!
                      </h3>
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your cart includes{" "}
                      <span className="font-medium text-foreground">
                        {freeDeliveryProducts.length === 1 
                          ? freeDeliveryProducts[0] 
                          : `${freeDeliveryProducts.length} products`}
                      </span>{" "}
                      with free delivery – enjoy <span className="font-semibold text-green-600 dark:text-green-400">FREE shipping</span> on your entire order!
                    </p>
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
                    <p className="text-sm text-muted-foreground">{item.products?.brand}</p>
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
