import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Phone, Clock } from "lucide-react";

const StoreLocations = () => {
  const { data: settings } = useQuery({
    queryKey: ['company-settings-store'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('key, value')
        .in('key', ['company_name', 'phone', 'address']);
      if (error) throw error;
      return data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string | null>) || {};
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Store Locations
          </h1>
          <p className="text-primary-foreground/80">
            Visit us at our store for the best shopping experience
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Main Store */}
            <div className="bg-card border rounded-lg overflow-hidden mb-8">
              <div className="bg-primary/5 p-6 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Main Store - Model Town, Lahore
                </h2>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Address</h3>
                      <p className="text-muted-foreground">
                        {settings?.address || 'Shop # 30 Saleem Complex, Q Block (Ext) Near Kashmir Bakers, Model Town, Lahore'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </h3>
                      <a href={`tel:${settings?.phone}`} className="text-primary hover:underline">
                        {settings?.phone || '0300-4649141'}
                      </a>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Business Hours
                      </h3>
                      <div className="text-muted-foreground text-sm space-y-1">
                        <p>Monday - Saturday: 10:00 AM - 9:00 PM</p>
                        <p>Sunday: 12:00 PM - 8:00 PM</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">What to Expect</h3>
                    <ul className="text-muted-foreground text-sm space-y-2">
                      <li>• Wide range of electronics and appliances</li>
                      <li>• Expert product advice</li>
                      <li>• Best price guarantee</li>
                      <li>• Easy financing options</li>
                      <li>• Immediate delivery available</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-secondary/30 rounded-lg p-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-bold mb-2">Find Us on Google Maps</h3>
              <p className="text-muted-foreground mb-4">
                Search for "{settings?.company_name || 'World Spilt Centre'}" on Google Maps
              </p>
              <a 
                href={`https://www.google.com/maps/search/${encodeURIComponent(settings?.address || 'Model Town Lahore')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StoreLocations;