import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Shield, Clock, Wrench, Phone } from "lucide-react";

const Warranty = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Warranty Information - World Spilt Centre"
        description="Learn about warranty coverage for electronics and appliances purchased from World Spilt Centre. Official manufacturer warranty on all products."
        keywords="warranty policy, product warranty pakistan, electronics warranty lahore, manufacturer warranty, appliance warranty"
      />
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Warranty Information
          </h1>
          <p className="text-primary-foreground/80">
            All products come with official manufacturer warranty
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Warranty Features */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Official Warranty</h3>
                <p className="text-sm text-muted-foreground">
                  Genuine manufacturer warranty
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">1-3 Years</h3>
                <p className="text-sm text-muted-foreground">
                  Warranty period varies by product
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Service Centers</h3>
                <p className="text-sm text-muted-foreground">
                  Nationwide service network
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Support</h3>
                <p className="text-sm text-muted-foreground">
                  Dedicated warranty support
                </p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <h2>Warranty Coverage</h2>
              <p className="text-muted-foreground">
                All products sold at our store come with official manufacturer warranty. The warranty 
                period varies by product and brand, typically ranging from 1 to 3 years for major 
                appliances and electronics.
              </p>

              <h2>What's Covered</h2>
              <ul className="text-muted-foreground">
                <li>Manufacturing defects</li>
                <li>Faulty components</li>
                <li>Performance issues due to quality</li>
                <li>Electrical/mechanical failures under normal use</li>
              </ul>

              <h2>What's Not Covered</h2>
              <ul className="text-muted-foreground">
                <li>Physical damage or misuse</li>
                <li>Damage from power fluctuations</li>
                <li>Unauthorized repairs or modifications</li>
                <li>Normal wear and tear</li>
                <li>Consumable parts (filters, bulbs, etc.)</li>
              </ul>

              <h2>How to Claim Warranty</h2>
              <ol className="text-muted-foreground">
                <li>Keep your purchase invoice safe - it's required for warranty claims</li>
                <li>Contact the manufacturer's service center or our customer support</li>
                <li>Provide your invoice, product serial number, and describe the issue</li>
                <li>The service center will arrange for inspection and repair</li>
              </ol>

              <h2>Brand Service Centers</h2>
              <p className="text-muted-foreground">
                Each brand has its own network of authorized service centers. You can find the nearest 
                service center by visiting the brand's official website or contacting our customer support 
                for assistance.
              </p>

              <div className="bg-secondary/30 p-6 rounded-lg not-prose">
                <h3 className="font-bold mb-2">Need Help?</h3>
                <p className="text-muted-foreground text-sm">
                  If you have any questions about warranty or need assistance with a warranty claim, 
                  please contact our customer support team. We're here to help!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Warranty;