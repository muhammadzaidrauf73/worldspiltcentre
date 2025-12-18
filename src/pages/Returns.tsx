import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RotateCcw, Clock, CheckCircle, XCircle } from "lucide-react";

const Returns = () => {
  const { data: settings } = useQuery({
    queryKey: ['company-settings-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('key, value')
        .in('key', ['company_name', 'return_policy']);
      if (error) throw error;
      return data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string | null>) || {};
    },
  });

  const companyName = settings?.company_name || 'World Spilt Centre';
  const returnContent = settings?.return_policy || '';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Returns Policy
          </h1>
          <p className="text-primary-foreground/80">
            Our hassle-free return and refund process
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {returnContent ? (
              <div className="prose prose-lg">
                <p className="text-muted-foreground whitespace-pre-line">{returnContent}</p>
              </div>
            ) : (
              <>
                {/* Return Policy Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-card border rounded-lg p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">7 Days Return</h3>
                    <p className="text-sm text-muted-foreground">
                      Return products within 7 days of delivery
                    </p>
                  </div>
                  <div className="bg-card border rounded-lg p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RotateCcw className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">Easy Process</h3>
                    <p className="text-sm text-muted-foreground">
                      Simple return process with pickup service
                    </p>
                  </div>
                  <div className="bg-card border rounded-lg p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">Quick Refund</h3>
                    <p className="text-sm text-muted-foreground">
                      Refund processed within 5-7 business days
                    </p>
                  </div>
                </div>

                <div className="prose prose-lg max-w-none">
                  <h2>Return Eligibility</h2>
                  <div className="grid md:grid-cols-2 gap-6 not-prose mb-8">
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6">
                      <h3 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-4">
                        <CheckCircle className="h-5 w-5" />
                        Eligible for Return
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Product received is damaged or defective</li>
                        <li>• Wrong product delivered</li>
                        <li>• Product not as described</li>
                        <li>• Product in original packaging, unused</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-6">
                      <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
                        <XCircle className="h-5 w-5" />
                        Not Eligible
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Products used or installed</li>
                        <li>• Products without original packaging</li>
                        <li>• Products with missing accessories</li>
                        <li>• Return request after 7 days</li>
                      </ul>
                    </div>
                  </div>

                  <h2>How to Return</h2>
                  <ol className="text-muted-foreground">
                    <li>Contact our customer support within 7 days of delivery</li>
                    <li>Provide your order number and reason for return</li>
                    <li>Our team will arrange for pickup or guide you to the nearest drop-off point</li>
                    <li>Ensure the product is in original condition with all accessories</li>
                    <li>Once received and inspected, refund will be processed</li>
                  </ol>

                  <h2>Refund Process</h2>
                  <p className="text-muted-foreground">
                    Refunds will be credited to the original payment method within 5-7 business days 
                    after we receive and verify the returned product. For cash on delivery orders, 
                    refunds will be processed via bank transfer.
                  </p>

                  <h2>Contact Us</h2>
                  <p className="text-muted-foreground">
                    For any questions about returns, please contact our customer support team.
                  </p>
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

export default Returns;