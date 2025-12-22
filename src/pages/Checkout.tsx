import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Truck, CreditCard, CheckCircle, Loader2, Tag, X, Percent } from "lucide-react";

interface ShippingOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimated_days: string | null;
  free_shipping_threshold: number | null;
}

interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
}

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [selectedShipping, setSelectedShipping] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch cart items
  const { data: cartItems = [], isLoading: cartLoading } = useQuery({
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

  // Fetch shipping options
  const { data: shippingOptions = [] } = useQuery({
    queryKey: ["shipping-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_settings")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (error) throw error;
      return data as ShippingOption[];
    },
  });

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Pre-fill form with profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.full_name || "",
        email: user?.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    } else if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [profile, user]);

  // Set default shipping option
  useEffect(() => {
    if (shippingOptions.length > 0 && !selectedShipping) {
      setSelectedShipping(shippingOptions[0].id);
    }
  }, [shippingOptions, selectedShipping]);

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (Number(item.products?.price) || 0) * item.quantity;
  }, 0);

  // Check if ALL products in cart qualify for free delivery
  const allProductsQualifyForFreeDelivery = cartItems.length > 0 && cartItems.every(
    item => item.products?.is_free_delivery === true
  );

  const selectedShippingOption = shippingOptions.find(s => s.id === selectedShipping);
  const shippingCost = allProductsQualifyForFreeDelivery 
    ? 0 
    : selectedShippingOption 
      ? (selectedShippingOption.free_shipping_threshold && subtotal >= selectedShippingOption.free_shipping_threshold 
          ? 0 
          : Number(selectedShippingOption.price))
      : 0;

  // Calculate discount
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === "percentage") {
      return Math.round((subtotal * appliedCoupon.discount_value) / 100);
    }
    return Math.min(appliedCoupon.discount_value, subtotal);
  };

  const discount = calculateDiscount();
  const total = subtotal - discount + shippingCost;

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    if (!user) {
      setCouponError("Please login to use coupons");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        setCouponError("Invalid coupon code");
        return;
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError("This coupon has expired");
        return;
      }

      // Check start date
      if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
        setCouponError("This coupon is not yet active");
        return;
      }

      // Check usage limit
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        setCouponError("This coupon has reached its usage limit");
        return;
      }

      // Check minimum order amount
      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        setCouponError(`Minimum order amount is Rs.${coupon.min_order_amount.toLocaleString()}`);
        return;
      }

      // Check per-user usage limit
      if (coupon.max_uses_per_user) {
        const { data: userUsage, error: usageError } = await supabase
          .from("coupon_usage")
          .select("id")
          .eq("coupon_id", coupon.id)
          .eq("user_id", user.id);

        if (usageError) throw usageError;

        if (userUsage && userUsage.length >= coupon.max_uses_per_user) {
          setCouponError(`You've already used this coupon ${coupon.max_uses_per_user} time(s)`);
          return;
        }
      }

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_amount: coupon.min_order_amount,
      });
      setCouponCode("");
      toast.success("Coupon applied successfully!");
    } catch (error: any) {
      console.error("Coupon error:", error);
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || cartItems.length === 0) return;
    
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create standardized order items format
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        name: item.products?.name || 'Product',
        quantity: item.quantity,
        price: Number(item.products?.price) || 0,
        image_url: item.products?.image_url || null,
      }));

      // Build order data with consistent structure
      const orderData: any = {
        user_id: user.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: formData.address,
        items: {
          products: orderItems,
          coupon: appliedCoupon ? {
            code: appliedCoupon.code,
            discount_type: appliedCoupon.discount_type,
            discount_value: appliedCoupon.discount_value,
            discount_amount: discount,
          } : null,
        },
        total: total,
        status: "pending",
      };

      const { data: orderResult, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select("id")
        .single();

      if (orderError) throw orderError;

      // Update coupon usage count and record per-user usage
      if (appliedCoupon && orderResult) {
        // Get current uses and increment
        const { data: couponData } = await supabase
          .from("coupons")
          .select("current_uses")
          .eq("id", appliedCoupon.id)
          .single();
        
        if (couponData) {
          await supabase
            .from("coupons")
            .update({ current_uses: (couponData.current_uses || 0) + 1 })
            .eq("id", appliedCoupon.id);
        }

        // Record per-user coupon usage for tracking
        await supabase
          .from("coupon_usage")
          .insert({
            coupon_id: appliedCoupon.id,
            user_id: user.id,
            order_id: orderResult.id,
            discount_amount: discount,
            order_total: total,
          });
      }

      // Clear cart
      const { error: cartError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (cartError) throw cartError;

      // Send order confirmation email
      try {
        const emailItems = cartItems.map(item => ({
          name: item.products?.name || 'Product',
          quantity: item.quantity,
          price: Number(item.products?.price) || 0,
        }));

        await supabase.functions.invoke('send-order-confirmation', {
          body: {
            customerEmail: formData.email,
            customerName: formData.name,
            customerPhone: formData.phone,
            orderId: orderResult.id,
            items: emailItems,
            total: total,
            shippingAddress: formData.address,
            coupon: appliedCoupon ? {
              code: appliedCoupon.code,
              discount: discount,
            } : null,
          },
        });
        console.log("Order confirmation email sent");
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
        // Don't fail the order if email fails
      }

      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      queryClient.invalidateQueries({ queryKey: ["coupon-analytics"] });
      
      toast.success("Order placed successfully! Check your email for confirmation.");
      navigate("/account");
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error("Failed to place order: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate("/products")}>Continue Shopping</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/cart")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>

        <h1 className="text-2xl font-heading font-bold text-foreground mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Contact Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Shipping Address
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your complete address including city and postal code"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Shipping Method
                </h2>
                
                {allProductsQualifyForFreeDelivery ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-accent bg-accent/10">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium text-accent">Free Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        All products in your cart qualify for free delivery
                      </p>
                    </div>
                  </div>
                ) : (
                  <RadioGroup 
                    value={selectedShipping} 
                    onValueChange={setSelectedShipping}
                    className="space-y-3"
                  >
                    {shippingOptions.map((option) => {
                      const isFree = option.free_shipping_threshold && subtotal >= option.free_shipping_threshold;
                      return (
                        <div
                          key={option.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                            selectedShipping === option.id 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedShipping(option.id)}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <div>
                              <Label htmlFor={option.id} className="font-medium cursor-pointer">
                                {option.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {option.description}
                                {option.estimated_days && ` • ${option.estimated_days}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {isFree ? (
                              <span className="text-accent font-semibold">FREE</span>
                            ) : (
                              <span className="font-semibold">Rs.{Number(option.price).toLocaleString()}</span>
                            )}
                            {option.free_shipping_threshold && !isFree && (
                              <p className="text-xs text-muted-foreground">
                                Free over Rs.{Number(option.free_shipping_threshold).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}
              </div>

              {/* Payment - COD Only */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </h2>
                <div className="flex items-center gap-3 p-4 rounded-lg border border-primary bg-primary/5">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Cash on Delivery (COD)</p>
                    <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
                <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>
                
                {/* Items */}
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 rounded bg-secondary/30 shrink-0 overflow-hidden">
                        <img
                          src={item.products?.image_url || "/placeholder.svg"}
                          alt={item.products?.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{item.products?.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-primary">
                          Rs.{(Number(item.products?.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Section */}
                <div className="border-t border-border pt-4 mb-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Apply Coupon
                  </h3>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium text-emerald-600">{appliedCoupon.code}</p>
                          <p className="text-xs text-muted-foreground">
                            {appliedCoupon.discount_type === "percentage" 
                              ? `${appliedCoupon.discount_value}% off`
                              : `Rs.${appliedCoupon.discount_value} off`
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={applyCoupon}
                          disabled={couponLoading}
                        >
                          {couponLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-destructive">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">Rs.{subtotal.toLocaleString()}</span>
                  </div>
                  
                  {appliedCoupon && discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span className="font-medium">-Rs.{discount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {allProductsQualifyForFreeDelivery ? "Free Delivery" : "Shipping"}
                    </span>
                    <span className="font-medium">
                      {shippingCost === 0 ? (
                        <span className="text-accent">FREE</span>
                      ) : (
                        `Rs.${shippingCost.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">Rs.{total.toLocaleString()}</span>
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full mt-6 bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
