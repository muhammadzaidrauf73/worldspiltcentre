import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  const { data: settings } = useQuery({
    queryKey: ['company-settings-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('key, value')
        .in('key', ['company_name', 'terms_conditions']);
      if (error) throw error;
      return data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string | null>) || {};
    },
  });

  const companyName = settings?.company_name || 'World Spilt Centre';
  const termsContent = settings?.terms_conditions || '';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Terms & Conditions
          </h1>
          <p className="text-primary-foreground/80">
            Please read these terms carefully before using our services
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            {termsContent ? (
              <p className="text-muted-foreground whitespace-pre-line">{termsContent}</p>
            ) : (
              <>
                <h2>1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using the {companyName} website and services, you accept and agree to be 
                  bound by these Terms and Conditions. If you do not agree to these terms, please do not 
                  use our services.
                </p>

                <h2>2. Products and Pricing</h2>
                <p className="text-muted-foreground">
                  All products listed on our website are subject to availability. Prices are subject to 
                  change without notice. We reserve the right to modify or discontinue any product at any time.
                </p>

                <h2>3. Orders and Payments</h2>
                <p className="text-muted-foreground">
                  By placing an order, you are making an offer to purchase the products. We reserve the 
                  right to accept or decline your order. Payment must be made in full before delivery.
                </p>

                <h2>4. Shipping and Delivery</h2>
                <p className="text-muted-foreground">
                  We aim to deliver products within the estimated timeframe. However, delivery times may 
                  vary depending on location and product availability. Shipping charges apply as displayed 
                  at checkout.
                </p>

                <h2>5. Returns and Refunds</h2>
                <p className="text-muted-foreground">
                  Products may be returned within 7 days of delivery in original condition. Refunds will 
                  be processed within 5-7 business days after receiving the returned item. Please refer 
                  to our Returns Policy for more details.
                </p>

                <h2>6. Warranty</h2>
                <p className="text-muted-foreground">
                  All products come with manufacturer warranty. Warranty claims must be made directly 
                  with the manufacturer or authorized service centers. Please refer to our Warranty 
                  page for more information.
                </p>

                <h2>7. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms & Conditions, please contact us through 
                  our Contact page or call our customer support.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;