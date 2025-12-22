import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Search,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StatusHistoryItem {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

interface OrderData {
  products: OrderItem[];
  coupon?: {
    code: string;
    discount_amount: number;
  } | null;
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  pending: { icon: Clock, label: "Order Placed", color: "text-amber-600", bgColor: "bg-amber-500" },
  confirmed: { icon: CheckCircle, label: "Confirmed", color: "text-blue-600", bgColor: "bg-blue-500" },
  processing: { icon: Package, label: "Processing", color: "text-purple-600", bgColor: "bg-purple-500" },
  shipped: { icon: Truck, label: "Shipped", color: "text-indigo-600", bgColor: "bg-indigo-500" },
  delivered: { icon: CheckCircle, label: "Delivered", color: "text-accent", bgColor: "bg-accent" },
  cancelled: { icon: XCircle, label: "Cancelled", color: "text-destructive", bgColor: "bg-destructive" },
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOrderId, setSearchOrderId] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [guestOrder, setGuestOrder] = useState<any>(null);
  const [guestStatusHistory, setGuestStatusHistory] = useState<StatusHistoryItem[]>([]);

  // Check for email in URL params (for order confirmation links)
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam && orderId) {
      setGuestEmail(emailParam);
      handleGuestVerification(orderId, emailParam);
    }
  }, [orderId, searchParams]);

  // Fetch order details for authenticated users
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", orderId, user?.id],
    queryFn: async () => {
      if (!orderId || !user) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId && !!user,
  });

  // Fetch status history for authenticated users
  const { data: statusHistory = [] } = useQuery({
    queryKey: ["order-status-history", orderId, user?.id],
    queryFn: async () => {
      if (!orderId || !user) return [];
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as StatusHistoryItem[];
    },
    enabled: !!orderId && !!user && !!order,
  });

  const handleGuestVerification = async (orderIdToVerify: string, email: string) => {
    if (!orderIdToVerify || !email) {
      toast.error("Please enter both Order ID and Email");
      return;
    }

    setIsVerifying(true);
    try {
      // Call RPC function to verify guest order
      const { data: orderData, error: orderError } = await supabase
        .rpc("verify_guest_order", {
          order_id_param: orderIdToVerify,
          email_param: email
        });

      if (orderError) throw orderError;

      if (!orderData || orderData.length === 0) {
        toast.error("Order not found or email doesn't match");
        setIsVerifying(false);
        return;
      }

      // Get status history
      const { data: historyData, error: historyError } = await supabase
        .rpc("get_guest_order_history", {
          order_id_param: orderIdToVerify,
          email_param: email
        });

      if (historyError) throw historyError;

      setGuestOrder(orderData[0]);
      setGuestStatusHistory(historyData || []);
      setVerifiedEmail(email);
      toast.success("Order verified successfully!");
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error("Failed to verify order. Please check your details.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderId.trim()) {
      if (user) {
        navigate(`/order-tracking/${searchOrderId.trim()}`);
      } else {
        // For guests, stay on current page and show email verification
        navigate(`/order-tracking/${searchOrderId.trim()}`);
      }
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId && guestEmail.trim()) {
      handleGuestVerification(orderId, guestEmail.trim());
    }
  };

  // Use guest order data if verified, otherwise use authenticated order
  const activeOrder = verifiedEmail ? guestOrder : order;
  const activeStatusHistory = verifiedEmail ? guestStatusHistory : statusHistory;

  const orderItems: OrderItem[] = activeOrder?.items 
    ? ((activeOrder.items as unknown as OrderData)?.products || [])
    : [];

  const currentStatus = activeOrder?.status || "pending";
  const currentConfig = statusConfig[currentStatus] || statusConfig.pending;

  // No order ID provided - show search
  if (!orderId) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-lg p-6 text-center shadow-sm">
              <Package className="h-12 w-12 mx-auto text-primary mb-4" />
              <h1 className="text-xl font-semibold mb-2">Track Your Order</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your order ID to track your package
              </p>
              <form onSubmit={handleSearch} className="space-y-3">
                <Input
                  placeholder="Enter Order ID"
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  className="text-center"
                />
                <Button type="submit" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Track Order
                </Button>
              </form>
              {user && (
                <Link to="/orders" className="block mt-4">
                  <Button variant="link" size="sm">
                    View all my orders
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Guest user needs to verify email
  if (!user && !verifiedEmail) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="text-center mb-6">
                <ShieldCheck className="h-12 w-12 mx-auto text-primary mb-4" />
                <h1 className="text-xl font-semibold mb-2">Verify Your Order</h1>
                <p className="text-sm text-muted-foreground">
                  Enter the email address used when placing your order
                </p>
              </div>
              
              <form onSubmit={handleGuestSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    value={orderId}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Verify & Track Order
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Have an account?
                </p>
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign in for easier tracking
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (orderLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-card rounded-lg p-6 text-center shadow-sm">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h1 className="text-xl font-semibold mb-2">Order Not Found</h1>
            <p className="text-sm text-muted-foreground mb-6">
              We couldn't find an order with this ID
            </p>
            <Button onClick={() => navigate("/order-tracking")}>
              Try Another Order ID
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Order Tracking</h1>
            <p className="text-xs text-muted-foreground">#{orderId?.slice(0, 8).toUpperCase()}</p>
          </div>
          {verifiedEmail && (
            <span className="ml-auto text-xs bg-accent/10 text-accent px-2 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current Status Card */}
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", currentConfig.bgColor)}>
                  <currentConfig.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className={cn("text-lg font-semibold", currentConfig.color)}>
                    {currentConfig.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {format(new Date(activeOrder.updated_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {/* Tracking Link */}
              {activeOrder.tracking_url && (
                <a
                  href={activeOrder.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm hover:bg-primary/10 transition-colors"
                >
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="flex-1">
                    Tracking: <span className="font-medium">{activeOrder.tracking_number || "View Tracking"}</span>
                  </span>
                  <ExternalLink className="h-4 w-4 text-primary" />
                </a>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-4">Order Timeline</h2>
              
              {activeStatusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tracking updates yet
                </p>
              ) : (
                <div className="relative">
                  {activeStatusHistory.map((item, index) => {
                    const config = statusConfig[item.status] || statusConfig.pending;
                    const Icon = config.icon;
                    const isLast = index === activeStatusHistory.length - 1;
                    const isCompleted = !isLast;

                    return (
                      <div key={item.id} className="flex gap-3 pb-4 last:pb-0">
                        {/* Timeline connector */}
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              isCompleted 
                                ? "bg-accent text-white" 
                                : `${config.bgColor} text-white`
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          {!isLast && (
                            <div className={cn(
                              "w-0.5 flex-1 mt-1",
                              isCompleted ? "bg-accent" : "bg-border"
                            )} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm font-medium",
                              isLast ? config.color : "text-foreground"
                            )}>
                              {config.label}
                            </p>
                            <time className="text-[10px] text-muted-foreground shrink-0">
                              {format(new Date(item.created_at), "MMM d, h:mm a")}
                            </time>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Order Items</h2>
              <div className="divide-y divide-border">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="w-12 h-12 rounded border border-border bg-white shrink-0 overflow-hidden">
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-1">{item.name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium text-primary">
                          Rs.{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Order Summary */}
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date</span>
                  <span>{format(new Date(activeOrder.created_at), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{orderItems.length}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">Rs.{Number(activeOrder.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Delivery Address</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{activeOrder.shipping_address || "Not provided"}</span>
                </div>
                {activeOrder.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{activeOrder.customer_phone}</span>
                  </div>
                )}
                {activeOrder.customer_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{activeOrder.customer_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Need Help?</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Contact us for any questions about your order
              </p>
              <Link to="/contact">
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderTracking;