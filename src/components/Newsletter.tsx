import { useState } from "react";
import { Mail, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      toast({
        title: "Successfully subscribed!",
        description: "You'll receive our best deals and updates.",
      });
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <section className="py-12 gradient-hero">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/10 backdrop-blur flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-primary-foreground mb-3">
            Get Exclusive Deals
          </h2>
          <p className="text-primary-foreground/80 mb-6">
            Subscribe to our newsletter and get 10% off your first order, plus early access to sales and new products.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-primary-foreground border-0 text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className={`h-12 px-6 ${
                isSubscribed
                  ? "bg-success hover:bg-success"
                  : "bg-accent hover:bg-accent/90"
              } text-accent-foreground font-semibold`}
              disabled={isSubscribed}
            >
              {isSubscribed ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Subscribed!
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-primary-foreground/60 mt-4">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
