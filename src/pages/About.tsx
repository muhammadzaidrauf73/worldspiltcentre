import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Building2, Users, Award, Heart } from "lucide-react";

const About = () => {
  const { data: settings } = useQuery({
    queryKey: ['company-settings-about'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('key, value')
        .in('key', ['company_name', 'about_us']);
      if (error) throw error;
      return data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string | null>) || {};
    },
  });

  const companyName = settings?.company_name || 'World Spilt Centre';
  const aboutContent = settings?.about_us || '';

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`About Us - ${companyName}`}
        description={`Learn about ${companyName}, your trusted electronics store in Lahore. We offer quality air conditioners, LED TVs, refrigerators, and home appliances with official warranty.`}
        keywords="about world spilt centre, electronics store lahore, trusted appliance store pakistan, model town electronics shop"
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            About {companyName}
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Your trusted destination for premium electronics and home appliances
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {aboutContent ? (
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">{aboutContent}</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Our Story</h2>
                    <p className="text-muted-foreground mb-4">
                      {companyName} has been serving customers with quality electronics and home appliances 
                      for years. We started with a simple mission: to provide the best products at the most 
                      competitive prices while delivering exceptional customer service.
                    </p>
                    <p className="text-muted-foreground">
                      Today, we are proud to be one of the leading electronics retailers, offering a wide 
                      range of products from trusted brands including Samsung, LG, Haier, TCL, and many more.
                    </p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">Why Choose Us?</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Award className="h-5 w-5 text-primary mt-0.5" />
                        <span>100% Genuine Products with Official Warranty</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Heart className="h-5 w-5 text-primary mt-0.5" />
                        <span>Customer-First Approach</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Building2 className="h-5 w-5 text-primary mt-0.5" />
                        <span>Trusted by Thousands of Customers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-primary mt-0.5" />
                        <span>Expert After-Sales Support</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Values */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-card rounded-lg border">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">Quality</h3>
                    <p className="text-sm text-muted-foreground">
                      We only sell genuine products from authorized distributors
                    </p>
                  </div>
                  <div className="text-center p-6 bg-card rounded-lg border">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">Trust</h3>
                    <p className="text-sm text-muted-foreground">
                      Building long-term relationships with our customers
                    </p>
                  </div>
                  <div className="text-center p-6 bg-card rounded-lg border">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">Service</h3>
                    <p className="text-sm text-muted-foreground">
                      Dedicated support before and after your purchase
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;