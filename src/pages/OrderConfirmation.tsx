import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, MapPin, Mail, Phone, Copy, ExternalLink, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface OrderData {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  status: string;
  total: number;
  items: {
    products: OrderItem[];
    coupon?: {
      code: string;
      discount_amount: number;
    };
    shipping?: {
      name: string;
      price: number;
    };
    payment_method?: string;
  };
}

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const email = searchParams.get("email");
  const { user } = useAuth();
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        // For authenticated users, fetch directly
        if (user) {
          const { data, error: fetchError } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .eq("user_id", user.id)
            .single();

          if (fetchError) throw fetchError;
          setOrder(data as unknown as OrderData);
        } else if (email) {
          // For guests, use the RPC function with email verification
          const { data, error: rpcError } = await supabase.rpc("verify_guest_order", {
            order_id_param: orderId,
            email_param: email,
          });

          if (rpcError) throw rpcError;
          if (data && data.length > 0) {
            setOrder(data[0] as unknown as OrderData);
          } else {
            setError("Order not found");
          }
        } else {
          // Guest without email - show limited info or redirect
          setError("Please provide your email to view order details");
        }
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, email, user]);

  // Fetch payment methods from database
  const { data: paymentMethodsData = [] } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch WhatsApp number from company settings
  const { data: whatsappSettings } = useQuery({
    queryKey: ["whatsapp-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("key, value")
        .in("key", ["whatsapp"]);
      if (error) throw error;
      return data?.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {} as Record<string, string>);
    },
  });

  const whatsappNumber = whatsappSettings?.whatsapp?.replace(/[^0-9]/g, '') || '923004649141';

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      toast.success("Order ID copied to clipboard");
    }
  };

  const items = order?.items?.products || [];
  const coupon = order?.items?.coupon;
  const shipping = order?.items?.shipping;
  const paymentMethod = order?.items?.payment_method || "cod";
  const selectedPaymentMethod = paymentMethodsData.find(m => m.method_key === paymentMethod);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || "We couldn't find this order"}</p>
            <Button asChild>
              <Link to="/">Continue Shopping</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We've sent a confirmation email to{" "}
            <span className="font-medium text-foreground">{order.customer_email}</span>
          </p>
        </div>

        {/* Order ID Card */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono text-lg font-semibold text-foreground">{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyOrderId}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy ID
                </Button>
                <Button size="sm" asChild>
                  <Link to={`/order-tracking?orderId=${order.id}${!user ? `&email=${encodeURIComponent(order.customer_email)}` : ''}`}>
                    <Truck className="h-4 w-4 mr-2" />
                    Track Order
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg bg-muted"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-foreground">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  {shipping && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping ({shipping.name})</span>
                      <span>{shipping.price === 0 ? "Free" : `Rs. ${shipping.price.toLocaleString()}`}</span>
                    </div>
                  )}
                  {coupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({coupon.code})</span>
                      <span>-Rs. {coupon.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>Rs. {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Order Processing</p>
                      <p className="text-sm text-muted-foreground">We're preparing your order for shipment</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-muted-foreground">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Shipping</p>
                      <p className="text-sm text-muted-foreground">You'll receive tracking details via email</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-muted-foreground">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Delivery</p>
                      <p className="text-sm text-muted-foreground">Your order will be delivered to your address</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details Card - show for non-COD methods */}
            {selectedPaymentMethod && selectedPaymentMethod.method_key !== "cod" && (selectedPaymentMethod.account_number || selectedPaymentMethod.iban) && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Please send payment to complete your order:
                  </p>
                  <div className="space-y-2 p-3 rounded bg-secondary border border-border">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedPaymentMethod.icon} {selectedPaymentMethod.bank_name || selectedPaymentMethod.label}
                    </p>
                    {selectedPaymentMethod.account_number && (
                      <p className="text-sm text-muted-foreground">
                        {selectedPaymentMethod.iban ? "Account #" : "Number"}: <span className="font-medium text-foreground">{selectedPaymentMethod.account_number}</span>
                      </p>
                    )}
                    {selectedPaymentMethod.iban && (
                      <p className="text-sm text-muted-foreground">
                        IBAN: <span className="font-medium text-foreground">{selectedPaymentMethod.iban}</span>
                      </p>
                    )}
                    {selectedPaymentMethod.account_title && (
                      <p className="text-sm text-muted-foreground">
                        Account Title: <span className="font-medium text-foreground">{selectedPaymentMethod.account_title}</span>
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    After sending payment, your order will be confirmed once we verify the transaction.
                  </p>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I have sent payment for order #${order.id.slice(0, 8).toUpperCase()}. Here is the screenshot:`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded bg-[#25D366] text-white text-sm font-medium hover:bg-[#20bd5a] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.913.913l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.347 0-4.518-.804-6.238-2.152l-.436-.358-3.2 1.073 1.073-3.2-.358-.436A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                    Send Screenshot on WhatsApp
                  </a>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Date */}
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Order placed on</p>
                <p className="font-medium">{format(new Date(order.created_at), "PPP 'at' p")}</p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/products">Continue Shopping</Link>
              </Button>
              {!user && (
                <Button variant="ghost" className="w-full" asChild>
                  <Link to="/auth">Create Account</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
