import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Truck, Clock, MapPin, Package } from "lucide-react";

const Shipping = () => {
  const { data: shippingSettings } = useQuery({
    queryKey: ['shipping-settings-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_settings')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Shipping Information - World Spilt Centre"
        description="Fast and reliable delivery across Pakistan. Free shipping on orders above threshold. Track your electronics order in real-time."
        keywords="shipping pakistan, delivery lahore, free shipping electronics, order tracking, nationwide delivery pakistan"
      />
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Shipping Information
          </h1>
          <p className="text-primary-foreground/80">
            Fast and reliable delivery across Pakistan
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Shipping Features */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Nationwide</h3>
                <p className="text-sm text-muted-foreground">
                  Delivery across Pakistan
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Fast Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  2-5 business days
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Safe Packaging</h3>
                <p className="text-sm text-muted-foreground">
                  Secure packaging for all items
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time order tracking
                </p>
              </div>
            </div>

            {/* Shipping Options */}
            {shippingSettings && shippingSettings.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Shipping Options</h2>
                <div className="grid gap-4">
                  {shippingSettings.map((option) => (
                    <div key={option.id} className="bg-card border rounded-lg p-6 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{option.name}</h3>
                        {option.description && (
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        )}
                        {option.estimated_days && (
                          <p className="text-sm text-muted-foreground">
                            Estimated: {option.estimated_days}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {option.is_free_shipping ? (
                          <span className="text-green-600 font-bold">FREE</span>
                        ) : (
                          <span className="font-bold">Rs {Number(option.price).toLocaleString()}</span>
                        )}
                        {option.free_shipping_threshold && (
                          <p className="text-xs text-muted-foreground">
                            Free above Rs {Number(option.free_shipping_threshold).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="prose prose-lg max-w-none">
              <h2>Delivery Areas</h2>
              <p className="text-muted-foreground">
                We deliver to all major cities and towns across Pakistan. Delivery times may vary 
                depending on your location:
              </p>
              <ul className="text-muted-foreground">
                <li><strong>Major Cities (Lahore, Karachi, Islamabad):</strong> 2-3 business days</li>
                <li><strong>Other Cities:</strong> 3-5 business days</li>
                <li><strong>Remote Areas:</strong> 5-7 business days</li>
              </ul>

              <h2>Order Processing</h2>
              <p className="text-muted-foreground">
                Orders are processed within 24 hours of confirmation. You will receive a tracking 
                number via SMS/email once your order is dispatched.
              </p>

              <h2>Delivery Instructions</h2>
              <ul className="text-muted-foreground">
                <li>Please ensure someone is available to receive the delivery</li>
                <li>Check the product condition before signing for delivery</li>
                <li>Report any damage immediately to the delivery person</li>
                <li>Keep your invoice for warranty and return purposes</li>
              </ul>

              <h2>Large Items</h2>
              <p className="text-muted-foreground">
                For large appliances like refrigerators, washing machines, and TVs, our delivery 
                team will bring the item to your doorstep. Installation services may be available 
                for an additional fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shipping;