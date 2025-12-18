import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Privacy = () => {
  const { data: settings } = useQuery({
    queryKey: ['company-settings-privacy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('key, value')
        .in('key', ['company_name', 'privacy_policy']);
      if (error) throw error;
      return data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string | null>) || {};
    },
  });

  const companyName = settings?.company_name || 'World Spilt Centre';
  const privacyContent = settings?.privacy_policy || '';

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Privacy Policy - World Spilt Centre"
        description="Read our privacy policy to understand how World Spilt Centre collects, uses, and protects your personal information when you shop with us."
        keywords="privacy policy, data protection, world spilt centre privacy, customer data security"
      />
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-primary-foreground/80">
            How we collect, use, and protect your information
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            {privacyContent ? (
              <p className="text-muted-foreground whitespace-pre-line">{privacyContent}</p>
            ) : (
              <>
                <h2>Information We Collect</h2>
                <p className="text-muted-foreground">
                  We collect information you provide directly to us, such as when you create an account, 
                  make a purchase, or contact us for support. This may include your name, email address, 
                  phone number, shipping address, and payment information.
                </p>

                <h2>How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  We use the information we collect to:
                </p>
                <ul className="text-muted-foreground">
                  <li>Process and fulfill your orders</li>
                  <li>Send you order confirmations and updates</li>
                  <li>Respond to your comments and questions</li>
                  <li>Send promotional communications (with your consent)</li>
                  <li>Improve our website and services</li>
                </ul>

                <h2>Information Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell, trade, or rent your personal information to third parties. We may share 
                  your information with service providers who assist us in operating our website and 
                  conducting our business.
                </p>

                <h2>Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction.
                </p>

                <h2>Cookies</h2>
                <p className="text-muted-foreground">
                  Our website uses cookies to enhance your browsing experience. You can choose to disable 
                  cookies through your browser settings, but this may affect some features of our website.
                </p>

                <h2>Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at {companyName}.
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

export default Privacy;