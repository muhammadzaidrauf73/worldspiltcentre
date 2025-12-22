import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Truck, CreditCard, CheckCircle, Loader2, Tag, X, MapPin, ShoppingCart, Package, Check, Star, Home, Building2 } from "lucide-react";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { addDays, format } from "date-fns";
import { FlashDealTimer } from "@/components/FlashDealTimer";

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

interface StoreLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface SavedAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  is_default: boolean;
}

// Brands eligible for location-based free delivery
const FREE_DELIVERY_BRANDS = ["gree", "pearl"];
const FREE_DELIVERY_RADIUS_KM = 5;

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { latitude, longitude, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();
  
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
  const [nearestStoreDistance, setNearestStoreDistance] = useState<number | null>(null);
  const [locationChecked, setLocationChecked] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("Home");
  const [isEditingReviewInfo, setIsEditingReviewInfo] = useState(false);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [expressCheckoutReady, setExpressCheckoutReady] = useState(false);

  // Guest checkout allowed - no redirect
  useEffect(() => {
    if (!authLoading && !user) {
      setIsGuestCheckout(true);
      setUseNewAddress(true);
    }
  }, [user, authLoading]);

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

  // Fetch active flash deals to apply deal prices
  const { data: activeFlashDeals = [] } = useQuery({
    queryKey: ["flash-deals-active-checkout"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flash_deals")
        .select("product_id, deal_price, original_price, name, ends_at")
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

  // Get flash deal info for an item
  const getFlashDealInfo = (item: any) => {
    return activeFlashDeals.find(d => d.product_id === item.product_id);
  };

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

  // Fetch store locations for distance calculation
  const { data: storeLocations = [] } = useQuery({
    queryKey: ["store-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_locations")
        .select("id, name, latitude, longitude")
        .eq("is_active", true);
      if (error) throw error;
      return data as StoreLocation[];
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

  // Fetch saved addresses
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedAddress[];
    },
    enabled: !!user,
  });

  // Pre-fill form with default address or profile data
  useEffect(() => {
    // If we have saved addresses and haven't selected one yet
    if (savedAddresses.length > 0 && !selectedAddressId && !useNewAddress) {
      const defaultAddress = savedAddresses.find(a => a.is_default) || savedAddresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        applyAddressToForm(defaultAddress);
        // Enable express checkout for users with saved addresses
        setExpressCheckoutReady(true);
      }
    } else if (savedAddresses.length === 0 && profile) {
      // No saved addresses, use profile data
      setUseNewAddress(true);
      setFormData({
        name: profile.full_name || "",
        email: user?.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    } else if (savedAddresses.length === 0 && user?.email) {
      setUseNewAddress(true);
      setFormData(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [savedAddresses, profile, user]);

  const applyAddressToForm = (address: SavedAddress) => {
    const fullAddress = [
      address.address_line1,
      address.address_line2,
      address.city,
      address.state,
      address.postal_code,
    ].filter(Boolean).join(", ");
    
    setFormData({
      name: address.full_name,
      email: user?.email || "",
      phone: address.phone || "",
      address: fullAddress,
    });
  };

  const handleSelectAddress = (addressId: string) => {
    const address = savedAddresses.find(a => a.id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setUseNewAddress(false);
      applyAddressToForm(address);
    }
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setUseNewAddress(true);
    setFormData({
      name: profile?.full_name || "",
      email: user?.email || "",
      phone: profile?.phone || "",
      address: "",
    });
  };

  // Set default shipping option
  useEffect(() => {
    if (shippingOptions.length > 0 && !selectedShipping) {
      setSelectedShipping(shippingOptions[0].id);
    }
  }, [shippingOptions, selectedShipping]);

  // Auto-fetch customer location on mount
  useEffect(() => {
    if (!locationChecked && storeLocations.length > 0) {
      requestLocation().then((coords) => {
        if (coords && storeLocations.length > 0) {
          // Calculate distance to nearest store
          const distances = storeLocations.map(store => 
            calculateDistance(coords.latitude, coords.longitude, Number(store.latitude), Number(store.longitude))
          );
          const minDistance = Math.min(...distances);
          setNearestStoreDistance(minDistance);
        }
        setLocationChecked(true);
      });
    }
  }, [storeLocations, locationChecked, requestLocation]);

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

  // Check if cart has Gree or Pearl brand products
  const hasEligibleBrandProducts = cartItems.some(item => {
    const brand = item.products?.brand?.toLowerCase() || "";
    return FREE_DELIVERY_BRANDS.includes(brand);
  });

  // Check if customer is within 5km of any store
  const isWithinDeliveryRadius = nearestStoreDistance !== null && nearestStoreDistance <= FREE_DELIVERY_RADIUS_KM;

  // Location-based free delivery for Gree/Pearl brands within 5km
  const locationBasedFreeDelivery = hasEligibleBrandProducts && isWithinDeliveryRadius;

  // Check if ANY product in cart qualifies for free delivery (then all products get free delivery)
  const anyProductQualifiesForFreeDelivery = cartItems.length > 0 && (
    cartItems.some(item => item.products?.is_free_delivery === true) || locationBasedFreeDelivery
  );

  const selectedShippingOption = shippingOptions.find(s => s.id === selectedShipping);
  const shippingCost = anyProductQualifiesForFreeDelivery 
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (cartItems.length === 0) return;
    
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create standardized order items format with flash deal prices
      const orderItems = cartItems.map(item => {
        const flashDeal = getFlashDealInfo(item);
        return {
          product_id: item.product_id,
          name: item.products?.name || 'Product',
          quantity: item.quantity,
          price: getEffectivePrice(item),
          original_price: flashDeal ? Number(flashDeal.original_price) : (item.products?.original_price ? Number(item.products.original_price) : null),
          image_url: item.products?.image_url || null,
          is_flash_deal: !!flashDeal,
        };
      });

      // Build order data with consistent structure
      const orderData: any = {
        user_id: user?.id || null, // Allow null for guest checkout
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
          shipping: selectedShippingOption ? {
            name: selectedShippingOption.name,
            price: shippingCost,
          } : null,
          is_guest_order: isGuestCheckout,
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

      // Save new address to address book if requested (only for logged in users)
      if (user && useNewAddress && saveNewAddress && formData.address) {
        try {
          // Parse address - simple split by comma for city extraction
          const addressParts = formData.address.split(',').map(p => p.trim());
          const city = addressParts.length > 1 ? addressParts[addressParts.length - 2] || addressParts[0] : addressParts[0];
          
          const { error: addressError } = await supabase
            .from("addresses")
            .insert({
              user_id: user.id,
              label: newAddressLabel,
              full_name: formData.name,
              phone: formData.phone,
              address_line1: formData.address,
              city: city,
              is_default: savedAddresses.length === 0, // Make default if first address
            });
          
          if (addressError) {
            console.error("Failed to save address:", addressError);
          } else {
            queryClient.invalidateQueries({ queryKey: ["addresses"] });
          }
        } catch (addressSaveError) {
          console.error("Error saving address:", addressSaveError);
          // Don't fail the order if address save fails
        }
      }

      // Clear cart (only for logged in users)
      if (user) {
        const { error: cartError } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);

        if (cartError) throw cartError;
      }

      // Send order confirmation email
      try {
        const emailItems = cartItems.map(item => ({
          name: item.products?.name || 'Product',
          quantity: item.quantity,
          price: getEffectivePrice(item),
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
      
      // Redirect based on user status
      if (user) {
        navigate("/account");
      } else {
        navigate(`/order-tracking?orderId=${orderResult.id}`);
      }
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error("Failed to place order: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Express checkout handler - skips steps for returning users
  const handleExpressCheckout = async () => {
    if (!expressCheckoutReady || !formData.name || !formData.address) {
      toast.error("Please select an address first");
      return;
    }
    
    // Set to default shipping if not selected
    if (!selectedShipping && shippingOptions.length > 0) {
      setSelectedShipping(shippingOptions[0].id);
    }
    
    await handleSubmit();
  };

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0 && !isGuestCheckout) {
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

  // Calculate estimated delivery date based on shipping option
  const getEstimatedDeliveryDate = () => {
    if (!selectedShippingOption?.estimated_days) return null;
    // Parse "3-5 days" or "2-3 business days" format
    const match = selectedShippingOption.estimated_days.match(/(\d+)(?:-(\d+))?/);
    if (!match) return null;
    const minDays = parseInt(match[1], 10);
    const maxDays = match[2] ? parseInt(match[2], 10) : minDays;
    const startDate = addDays(new Date(), minDays);
    const endDate = addDays(new Date(), maxDays);
    return {
      start: format(startDate, "MMM d"),
      end: format(endDate, "MMM d"),
      isSameDay: minDays === maxDays
    };
  };

  const estimatedDelivery = getEstimatedDeliveryDate();

  // Validate current step
  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return formData.name && formData.email && formData.phone && formData.address && selectedShipping;
    }
    if (currentStep === 2) {
      return true; // Payment is always valid (COD)
    }
    return true;
  };

  const goToNextStep = () => {
    if (canProceedToNextStep() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 1 && !canProceedToNextStep()) {
      toast.error("Please fill in all required fields");
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/cart");
    }
  };

  // Progress steps with navigation
  const steps = [
    { id: 0, label: "Cart", icon: ShoppingCart, completed: true },
    { id: 1, label: "Shipping", icon: Truck, completed: currentStep > 1 },
    { id: 2, label: "Payment", icon: CreditCard, completed: currentStep > 2 },
    { id: 3, label: "Review", icon: Check, completed: false },
  ];

  const handleStepClick = (stepId: number) => {
    if (stepId === 0) {
      navigate("/cart");
    } else if (stepId < currentStep) {
      setCurrentStep(stepId);
    } else if (stepId === currentStep + 1 && canProceedToNextStep()) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-4xl">
        {/* Express Checkout Banner - for returning users with saved addresses */}
        {expressCheckoutReady && user && savedAddresses.length > 0 && currentStep === 1 && (
          <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Express Checkout Available</h3>
                  <p className="text-xs text-muted-foreground">
                    Use your saved address to checkout instantly
                  </p>
                </div>
              </div>
              <Button 
                type="button"
                onClick={handleExpressCheckout}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    One-Click Checkout
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Guest Checkout Notice */}
        {isGuestCheckout && (
          <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Checking out as guest</span>
            </div>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => navigate("/auth?redirect=/checkout")}
              className="text-primary p-0 h-auto"
            >
              Sign in for faster checkout
            </Button>
          </div>
        )}

        {/* Progress Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleStepClick(step.id)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.completed 
                        ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" 
                        : currentStep === step.id
                          ? "border-primary text-primary bg-primary/10"
                          : step.id < currentStep
                            ? "border-muted-foreground/30 text-muted-foreground hover:border-primary/50 cursor-pointer"
                            : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {step.completed ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                  <span 
                    onClick={() => handleStepClick(step.id)}
                    className={`text-xs mt-1 hidden sm:block ${
                      step.completed || currentStep === step.id ? "text-primary font-medium" : "text-muted-foreground"
                    } ${step.id <= currentStep ? "cursor-pointer hover:text-primary" : ""}`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 ${
                      step.completed ? "bg-primary" : "bg-muted-foreground/30"
                    }`} 
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={goToPreviousStep}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            {currentStep === 1 && "Shipping Details"}
            {currentStep === 2 && "Payment Method"}
            {currentStep === 3 && "Review Order"}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Left Column - Step Content */}
            <div className="lg:col-span-2 space-y-3">
              
              {/* Step 1: Shipping */}
              {currentStep === 1 && (
                <>
                  {/* Delivery Address */}
                  <div className="bg-card rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Delivery Address
                      </h2>
                    </div>

                    {/* Saved Addresses */}
                    {savedAddresses.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">Select a saved address:</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {savedAddresses.map((address) => (
                            <button
                              key={address.id}
                              type="button"
                              onClick={() => handleSelectAddress(address.id)}
                              className={`text-left p-3 rounded-lg border transition-all ${
                                selectedAddressId === address.id && !useNewAddress
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border hover:border-primary/50 bg-secondary/30"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {address.label.toLowerCase() === "home" ? (
                                    <Home className="h-4 w-4 text-primary shrink-0" />
                                  ) : address.label.toLowerCase() === "office" ? (
                                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                                  ) : (
                                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                                  )}
                                  <span className="text-sm font-medium">{address.label}</span>
                                </div>
                                {address.is_default && (
                                  <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                                    <Star className="h-3 w-3 fill-primary" />
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-foreground mt-1.5">{address.full_name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {address.address_line1}
                                {address.address_line2 && `, ${address.address_line2}`}
                                {address.city && `, ${address.city}`}
                              </p>
                              {selectedAddressId === address.id && !useNewAddress && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                                  <Check className="h-3 w-3" />
                                  Selected
                                </div>
                              )}
                            </button>
                          ))}
                          
                          {/* Add new address option */}
                          <button
                            type="button"
                            onClick={handleUseNewAddress}
                            className={`text-left p-3 rounded-lg border transition-all ${
                              useNewAddress
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-dashed border-border hover:border-primary/50 bg-secondary/20"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">New Address</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Enter a different delivery address
                            </p>
                            {useNewAddress && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                                <Check className="h-3 w-3" />
                                Selected
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Address Form - shown if no saved addresses or using new address */}
                    {(savedAddresses.length === 0 || useNewAddress) && (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Full Name *"
                            required
                            className="h-9 text-sm"
                          />
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Phone Number *"
                            required
                            className="h-9 text-sm"
                          />
                        </div>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Email Address *"
                          required
                          className="h-9 text-sm"
                        />
                        <Textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Complete Address (House No, Street, City, Postal Code) *"
                          rows={2}
                          required
                          className="text-sm resize-none"
                        />

                        {/* Save address option */}
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                          <Checkbox
                            id="save-address"
                            checked={saveNewAddress}
                            onCheckedChange={(checked) => setSaveNewAddress(checked === true)}
                          />
                          <div className="flex-1">
                            <Label htmlFor="save-address" className="text-sm font-medium cursor-pointer">
                              Save this address for future orders
                            </Label>
                            {saveNewAddress && (
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setNewAddressLabel("Home")}
                                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                    newAddressLabel === "Home"
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-border hover:border-primary"
                                  }`}
                                >
                                  <Home className="h-3 w-3 inline mr-1" />
                                  Home
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewAddressLabel("Office")}
                                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                    newAddressLabel === "Office"
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-border hover:border-primary"
                                  }`}
                                >
                                  <Building2 className="h-3 w-3 inline mr-1" />
                                  Office
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewAddressLabel("Other")}
                                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                    newAddressLabel === "Other"
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-border hover:border-primary"
                                  }`}
                                >
                                  Other
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show selected address details if using saved address */}
                    {selectedAddressId && !useNewAddress && (
                      <div className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Delivering to:</p>
                        <p className="text-sm font-medium">{formData.name}</p>
                        <p className="text-sm text-muted-foreground">{formData.phone}</p>
                        <p className="text-sm text-muted-foreground">{formData.address}</p>
                      </div>
                    )}
                      
                    {/* Location-based Free Delivery */}
                    {hasEligibleBrandProducts && (
                      <div className="mt-3 flex items-center justify-between p-2 rounded bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs">
                            {locationLoading ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Checking location...
                              </span>
                            ) : isWithinDeliveryRadius ? (
                              <span className="text-accent font-medium">Free delivery eligible! ({nearestStoreDistance?.toFixed(1)}km from store)</span>
                            ) : nearestStoreDistance !== null ? (
                              <span className="text-muted-foreground">{nearestStoreDistance.toFixed(1)}km from store (5km needed for free delivery)</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setLocationChecked(false)}
                                className="text-primary hover:underline"
                              >
                                Enable location for free delivery
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shipping Options */}
                  <div className="bg-card rounded p-4">
                    <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      Delivery Option
                    </h2>
                    
                    {anyProductQualifiesForFreeDelivery ? (
                      <div className="flex items-center gap-2 p-3 rounded bg-accent/10 border border-accent/30">
                        <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-accent">Free Delivery</p>
                          <p className="text-xs text-muted-foreground">
                            {locationBasedFreeDelivery 
                              ? "Gree/Pearl products within 5km"
                              : "Eligible product in cart"
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <RadioGroup 
                        value={selectedShipping} 
                        onValueChange={setSelectedShipping}
                        className="space-y-2"
                      >
                        {shippingOptions.map((option) => {
                          const isFree = option.free_shipping_threshold && subtotal >= option.free_shipping_threshold;
                          return (
                            <label
                              key={option.id}
                              htmlFor={option.id}
                              className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                                selectedShipping === option.id 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value={option.id} id={option.id} className="h-4 w-4" />
                                <div>
                                  <p className="text-sm font-medium">{option.name}</p>
                                  {option.estimated_days && (
                                    <p className="text-xs text-muted-foreground">{option.estimated_days}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`text-sm font-semibold ${isFree ? 'text-accent' : ''}`}>
                                {isFree ? "FREE" : `Rs.${Number(option.price).toLocaleString()}`}
                              </span>
                            </label>
                          );
                        })}
                      </RadioGroup>
                    )}
                    
                    {/* Estimated Delivery Date */}
                    {estimatedDelivery && (
                      <div className="mt-3 flex items-center gap-2 p-2 rounded bg-secondary/50">
                        <Package className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Estimated delivery:{" "}
                          <span className="font-medium text-foreground">
                            {estimatedDelivery.isSameDay 
                              ? estimatedDelivery.start
                              : `${estimatedDelivery.start} - ${estimatedDelivery.end}`
                            }
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <div className="bg-card rounded p-4">
                  <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment Method
                  </h2>
                  <div className="flex items-center gap-2 p-3 rounded border border-primary bg-primary/5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                    </div>
                  </div>

                  {/* Coupon Section */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      Have a Voucher?
                    </h3>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-2 bg-accent/10 border border-accent/30 rounded">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-accent" />
                          <div>
                            <p className="text-sm font-medium text-accent">{appliedCoupon.code}</p>
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
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter voucher code"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                          }}
                          className="h-9 text-sm flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={applyCoupon}
                          disabled={couponLoading}
                          className="h-9 px-4"
                        >
                          {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                    )}
                    {couponError && (
                      <p className="text-xs text-destructive mt-1">{couponError}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <>
                  {/* Delivery Info Summary - Editable */}
                  <div className="bg-card rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Delivery & Contact Info
                      </h2>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditingReviewInfo(!isEditingReviewInfo)}
                        className="h-6 text-xs text-primary"
                      >
                        {isEditingReviewInfo ? "Done" : "Edit"}
                      </Button>
                    </div>
                    
                    {isEditingReviewInfo ? (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="review-name" className="text-xs text-muted-foreground">Full Name</Label>
                            <Input
                              id="review-name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="h-9 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="review-phone" className="text-xs text-muted-foreground">Phone</Label>
                            <Input
                              id="review-phone"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="h-9 text-sm mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="review-email" className="text-xs text-muted-foreground">Email</Label>
                          <Input
                            id="review-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="h-9 text-sm mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="review-address" className="text-xs text-muted-foreground">Delivery Address</Label>
                          <Textarea
                            id="review-address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={2}
                            className="text-sm resize-none mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm space-y-1">
                        <p className="font-medium">{formData.name}</p>
                        <p className="text-muted-foreground">{formData.phone}</p>
                        <p className="text-muted-foreground">{formData.email}</p>
                        <p className="text-muted-foreground">{formData.address}</p>
                      </div>
                    )}
                  </div>

                  {/* Products Summary */}
                  <div className="bg-card rounded p-4">
                    <h2 className="text-sm font-semibold text-foreground mb-3">
                      Package ({cartItems.length} items)
                    </h2>
                    <div className="divide-y divide-border">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                          <div className="w-14 h-14 rounded border border-border bg-white shrink-0 overflow-hidden">
                            <img
                              src={item.products?.image_url || "/placeholder.svg"}
                              alt={item.products?.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2 mb-1">{item.products?.name}</p>
                            <div className="flex items-center flex-wrap gap-1.5">
                              {hasFlashDeal(item) && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-deal/10 text-deal font-medium">
                                  ⚡ Flash Deal
                                </span>
                              )}
                              {getFlashDealInfo(item) && (
                                <FlashDealTimer endsAt={getFlashDealInfo(item)!.ends_at} compact />
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                              <span className="text-sm font-semibold text-primary">
                                Rs.{(getEffectivePrice(item) * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-card rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Payment Method
                      </h2>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentStep(2)}
                        className="h-6 text-xs text-primary"
                      >
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm">Cash on Delivery</p>
                    {appliedCoupon && (
                      <div className="mt-2 flex items-center gap-2 text-accent">
                        <Tag className="h-3.5 w-3.5" />
                        <span className="text-sm">Voucher: {appliedCoupon.code}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded p-4 sticky top-20">
                <h3 className="text-sm font-semibold mb-3">Order Summary</h3>

                {/* Summary */}
                <div className="space-y-2 text-sm border-t border-border pt-3">
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
                  {appliedCoupon && discount > 0 && (
                    <div className="flex justify-between text-accent">
                      <span>Voucher Discount</span>
                      <span>-Rs.{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shippingCost === 0 ? 'text-accent' : ''}>
                      {shippingCost === 0 ? "FREE" : `Rs.${shippingCost.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* Total Savings Summary */}
                {(flashDealSavings > 0 || discount > 0) && (
                  <div className="mt-2 p-2.5 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-accent flex items-center gap-1.5">
                        🎉 Total Savings
                      </span>
                      <span className="text-sm font-bold text-accent">
                        Rs.{(flashDealSavings + discount).toLocaleString()}
                      </span>
                    </div>
                    {flashDealSavings > 0 && discount > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Flash Deals: Rs.{flashDealSavings.toLocaleString()} + Voucher: Rs.{discount.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between py-3 mt-2 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">Rs.{total.toLocaleString()}</span>
                </div>

                {/* Estimated Delivery */}
                {estimatedDelivery && (
                  <div className="mb-3 flex items-center gap-2 p-2 rounded bg-secondary/50">
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Delivery:{" "}
                      <span className="font-medium text-foreground">
                        {estimatedDelivery.isSameDay 
                          ? estimatedDelivery.start
                          : `${estimatedDelivery.start} - ${estimatedDelivery.end}`
                        }
                      </span>
                    </p>
                  </div>
                )}

                {currentStep < 3 ? (
                  <Button 
                    type="button"
                    onClick={goToNextStep}
                    className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center mt-3">
                  By placing order, you agree to our Terms & Conditions
                </p>
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
