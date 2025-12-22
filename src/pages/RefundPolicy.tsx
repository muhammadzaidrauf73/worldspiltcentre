import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Clock, CreditCard, CheckCircle, XCircle, HelpCircle, ArrowRight } from "lucide-react";

const RefundPolicy = () => {
  const { data: settings } = useQuery({
    queryKey: ['company-settings-refund'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('key, value')
        .in('key', ['company_name', 'refund_policy']);
      if (error) throw error;
      return data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string | null>) || {};
    },
  });

  const companyName = settings?.company_name || 'World Spilt Centre';
  const refundContent = settings?.refund_policy || '';

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Refund Policy - World Spilt Centre"
        description="Learn about our refund policy, timelines, and procedures. Get your money back hassle-free at World Spilt Centre."
        keywords="refund policy, money back, refund process, refund timeline, world spilt centre refund"
      />
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Refund Policy
          </h1>
          <p className="text-primary-foreground/80">
            Our commitment to your satisfaction with clear refund procedures
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {refundContent ? (
              <div className="prose prose-lg max-w-none">
                <div 
                  className="text-muted-foreground whitespace-pre-line"
                  dangerouslySetInnerHTML={{ 
                    __html: refundContent
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />') 
                  }}
                />
              </div>
            ) : (
              <>
                {/* Refund Timeline Cards */}
                <div className="grid md:grid-cols-4 gap-4 mb-12">
                  <div className="bg-card border rounded-lg p-5 text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">Request</h3>
                    <p className="text-xs text-muted-foreground">Within 7 days</p>
                  </div>
                  <div className="bg-card border rounded-lg p-5 text-center">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <HelpCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">Inspection</h3>
                    <p className="text-xs text-muted-foreground">1-2 days</p>
                  </div>
                  <div className="bg-card border rounded-lg p-5 text-center">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ArrowRight className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">Processing</h3>
                    <p className="text-xs text-muted-foreground">3-5 days</p>
                  </div>
                  <div className="bg-card border rounded-lg p-5 text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">Credit</h3>
                    <p className="text-xs text-muted-foreground">5-7 days</p>
                  </div>
                </div>

                <div className="prose prose-lg max-w-none">
                  <h2>Refund Eligibility</h2>
                  <div className="grid md:grid-cols-2 gap-6 not-prose mb-8">
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6">
                      <h3 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-4">
                        <CheckCircle className="h-5 w-5" />
                        Eligible for Refund
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Products returned within 7 days of delivery</li>
                        <li>• Items unused and in original packaging</li>
                        <li>• All accessories and documentation included</li>
                        <li>• Products received damaged or defective</li>
                        <li>• Wrong product delivered</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-6">
                      <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
                        <XCircle className="h-5 w-5" />
                        Not Eligible for Refund
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Personalized or customized products</li>
                        <li>• Digital products after download</li>
                        <li>• Products damaged by customer misuse</li>
                        <li>• Items returned after 7-day window</li>
                        <li>• Products with missing accessories</li>
                      </ul>
                    </div>
                  </div>

                  <h2>Refund Methods</h2>
                  <div className="not-prose grid md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-card border rounded-lg p-5">
                      <h4 className="font-semibold mb-2">Original Payment</h4>
                      <p className="text-sm text-muted-foreground">
                        Credit/debit card refunds are processed back to the original card within 5-7 business days.
                      </p>
                    </div>
                    <div className="bg-card border rounded-lg p-5">
                      <h4 className="font-semibold mb-2">Bank Transfer</h4>
                      <p className="text-sm text-muted-foreground">
                        For Cash on Delivery orders, refunds are processed via bank transfer. Provide your bank details.
                      </p>
                    </div>
                    <div className="bg-card border rounded-lg p-5">
                      <h4 className="font-semibold mb-2">Store Credit</h4>
                      <p className="text-sm text-muted-foreground">
                        Opt for instant store credit to use on your next purchase. Available immediately after approval.
                      </p>
                    </div>
                  </div>

                  <h2>Partial Refunds</h2>
                  <p className="text-muted-foreground">
                    In certain cases, partial refunds may be issued:
                  </p>
                  <ul className="text-muted-foreground">
                    <li>Products returned with missing accessories (deduction based on accessory value)</li>
                    <li>Items with minor cosmetic damage that occurred after delivery</li>
                    <li>Opened software or digital media packages</li>
                    <li>Products returned after 7 days but within 14 days (15% restocking fee)</li>
                  </ul>

                  <h2>How to Request a Refund</h2>
                  <ol className="text-muted-foreground">
                    <li><strong>Contact Customer Service:</strong> Call 0300-4649141 or email within 7 days of delivery</li>
                    <li><strong>Provide Details:</strong> Share your order number and reason for refund</li>
                    <li><strong>Get Authorization:</strong> Receive a return authorization number</li>
                    <li><strong>Return Product:</strong> Ship the product back or schedule a pickup</li>
                    <li><strong>Inspection:</strong> Our team inspects the product (1-2 business days)</li>
                    <li><strong>Receive Refund:</strong> Refund processed to your preferred method</li>
                  </ol>

                  <h2>Contact Us</h2>
                  <p className="text-muted-foreground">
                    For any questions about refunds, contact our customer support team at {companyName}.
                    We are available Monday to Saturday, 9 AM - 6 PM.
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

export default RefundPolicy;