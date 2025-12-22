import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { OrderTimeline } from "@/components/OrderTimeline";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Package, ShoppingBag, Truck, ExternalLink, MapPin, XCircle, Loader2, Download, ChevronDown, Clock, ArrowLeft, User, Heart } from "lucide-react";
import { format } from "date-fns";

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch user orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch cancellation requests
  const { data: cancellationRequests = [] } = useQuery({
    queryKey: ["cancellation-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("order_cancellation_requests")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Cancel request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { error } = await supabase
        .from("order_cancellation_requests")
        .insert({
          order_id: orderId,
          user_id: user!.id,
          reason: reason.trim(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cancellation-requests"] });
      toast({
        title: "Request submitted",
        description: "Your cancellation request has been submitted. We'll review it shortly.",
      });
      setCancelDialogOpen(false);
      setCancelReason("");
      setSelectedOrderId(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit cancellation request. Please try again.",
      });
    },
  });

  const handleCancelRequest = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCancelDialogOpen(true);
  };

  const submitCancelRequest = () => {
    if (!selectedOrderId || !cancelReason.trim()) return;
    cancelRequestMutation.mutate({ orderId: selectedOrderId, reason: cancelReason });
  };

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingInvoice(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please sign in to download invoice.",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-invoice", {
        body: { orderId },
      });

      if (error) throw error;

      if (data?.pdf) {
        const link = document.createElement("a");
        link.href = data.pdf;
        link.download = data.filename || `invoice-${orderId.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Invoice downloaded",
          description: "Your invoice has been downloaded successfully.",
        });
      }
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download invoice. Please try again.",
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const getCancellationStatus = (orderId: string) => {
    return cancellationRequests.find((req: any) => req.order_id === orderId);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["user-orders"] });
    await queryClient.invalidateQueries({ queryKey: ["cancellation-requests"] });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">
        <Navbar />
      
        <div className="container mx-auto px-4 py-8">
          {/* Header with navigation */}
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              My Orders
            </h1>
          </div>

          {/* Quick Links */}
          <div className="flex gap-3 mb-6">
            <Link to="/profile">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </Button>
            </Link>
            <Link to="/wishlist">
              <Button variant="outline" size="sm" className="gap-2">
                <Heart className="h-4 w-4" />
                Wishlist
              </Button>
            </Link>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6">
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No orders yet</p>
                <p className="text-sm mb-4">Your order history will appear here</p>
                <Link to="/products">
                  <Button>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => {
                  const rawItems = order.items;
                  let items: OrderItem[] = [];
                  let couponInfo = null;
                  
                  if (Array.isArray(rawItems)) {
                    items = rawItems.map((item: any) => ({
                      product_id: item.product_id || item.id || '',
                      name: item.name || item.product_name || 'Product',
                      price: Number(item.price) || 0,
                      quantity: item.quantity || 1,
                      image_url: item.image_url || null,
                    }));
                  } else if (rawItems && typeof rawItems === 'object') {
                    const productItems = rawItems.products || [];
                    items = productItems.map((item: any) => ({
                      product_id: item.product_id || item.id || '',
                      name: item.name || item.product_name || 'Product',
                      price: Number(item.price) || 0,
                      quantity: item.quantity || 1,
                      image_url: item.image_url || null,
                    }));
                    couponInfo = rawItems.coupon || null;
                  }
                  
                  return (
                    <div key={order.id} className="border border-border rounded-lg overflow-hidden">
                      {/* Order Header */}
                      <div className="bg-secondary/30 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Order ID: </span>
                            <span className="font-mono font-medium">{order.id.slice(0, 8)}...</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date: </span>
                            <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total: </span>
                            <span className="font-semibold text-primary">Rs.{Number(order.total).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(order.id)}
                            disabled={downloadingInvoice === order.id}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {downloadingInvoice === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">Invoice</span>
                          </Button>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status] || 'bg-muted'}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="p-4">
                        <div className="space-y-3">
                          {items?.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
                                <img 
                                  src={item.image_url || '/placeholder.svg'} 
                                  alt={item.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {item.quantity} × Rs.{Number(item.price).toLocaleString()}
                                </p>
                              </div>
                              <p className="font-medium text-foreground">
                                Rs.{(item.quantity * item.price).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                        
                        {/* Shipping Address */}
                        {order.shipping_address && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Shipping to: </span>
                              {order.shipping_address}
                            </p>
                          </div>
                        )}

                        {/* Tracking Info */}
                        {(order.status === "shipped" || order.status === "delivered") && order.tracking_number && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Truck className="h-4 w-4 text-purple-600" />
                                <p className="font-medium text-purple-600 text-sm">
                                  {order.status === "delivered" ? "Delivered" : "In Transit"}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-4">
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Tracking #: </span>
                                  <span className="font-mono font-medium">{order.tracking_number}</span>
                                </p>
                                {order.tracking_url && (
                                  <a 
                                    href={order.tracking_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                  >
                                    <MapPin className="h-3 w-3" />
                                    Track Package
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Order Status Timeline */}
                        <div className="mt-4 pt-4 border-t border-border">
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                                <span className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Order Status Timeline
                                </span>
                                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <OrderTimeline orderId={order.id} />
                            </CollapsibleContent>
                          </Collapsible>
                        </div>

                        {/* Cancel Order Button */}
                        {(order.status === "pending" || order.status === "processing") && (
                          <div className="mt-4 pt-4 border-t border-border">
                            {(() => {
                              const cancelRequest = getCancellationStatus(order.id);
                              if (cancelRequest) {
                                return (
                                  <div className={`p-3 rounded-lg text-sm ${
                                    cancelRequest.status === 'pending' 
                                      ? 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20'
                                      : cancelRequest.status === 'approved'
                                      ? 'bg-green-500/10 text-green-700 border border-green-500/20'
                                      : 'bg-red-500/10 text-red-700 border border-red-500/20'
                                  }`}>
                                    <p className="font-medium">
                                      Cancellation {cancelRequest.status === 'pending' ? 'Requested' : cancelRequest.status.charAt(0).toUpperCase() + cancelRequest.status.slice(1)}
                                    </p>
                                    {cancelRequest.admin_notes && (
                                      <p className="mt-1 text-xs opacity-80">{cancelRequest.admin_notes}</p>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                                  onClick={() => handleCancelRequest(order.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Request Cancellation
                                </Button>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Cancel Order Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Order Cancellation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Please tell us why you'd like to cancel this order. Our team will review your request and get back to you.
              </p>
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Reason for cancellation *</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="E.g., Changed my mind, found a better price, ordered by mistake..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitCancelRequest}
                disabled={!cancelReason.trim() || cancelRequestMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {cancelRequestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Footer />
      </div>
    </PullToRefresh>
  );
};

export default Orders;
