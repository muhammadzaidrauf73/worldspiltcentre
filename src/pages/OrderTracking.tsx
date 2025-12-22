import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOrderId, setSearchOrderId] = useState("");

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Fetch status history
  const { data: statusHistory = [] } = useQuery({
    queryKey: ["order-status-history", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as StatusHistoryItem[];
    },
    enabled: !!orderId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderId.trim()) {
      navigate(`/order-tracking/${searchOrderId.trim()}`);
    }
  };

  const orderItems: OrderItem[] = order?.items 
    ? ((order.items as unknown as OrderData)?.products || [])
    : [];

  const currentStatus = order?.status || "pending";
  const currentConfig = statusConfig[currentStatus] || statusConfig.pending;

  // No order ID provided - show search
  if (!orderId) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded p-6 text-center">
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

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-card rounded p-6 text-center">
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
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current Status Card */}
            <div className="bg-card rounded p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", currentConfig.bgColor)}>
                  <currentConfig.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className={cn("text-lg font-semibold", currentConfig.color)}>
                    {currentConfig.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {format(new Date(order.updated_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {/* Tracking Link */}
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded bg-primary/5 border border-primary/20 text-sm hover:bg-primary/10 transition-colors"
                >
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="flex-1">
                    Tracking: <span className="font-medium">{order.tracking_number || "View Tracking"}</span>
                  </span>
                  <ExternalLink className="h-4 w-4 text-primary" />
                </a>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-card rounded p-4">
              <h2 className="text-sm font-semibold mb-4">Order Timeline</h2>
              
              {statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tracking updates yet
                </p>
              ) : (
                <div className="relative">
                  {statusHistory.map((item, index) => {
                    const config = statusConfig[item.status] || statusConfig.pending;
                    const Icon = config.icon;
                    const isLast = index === statusHistory.length - 1;
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
            <div className="bg-card rounded p-4">
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
            <div className="bg-card rounded p-4">
              <h2 className="text-sm font-semibold mb-3">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date</span>
                  <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{orderItems.length}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">Rs.{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-card rounded p-4">
              <h2 className="text-sm font-semibold mb-3">Delivery Address</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{order.shipping_address || "Not provided"}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{order.customer_phone}</span>
                  </div>
                )}
                {order.customer_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{order.customer_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-card rounded p-4">
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
