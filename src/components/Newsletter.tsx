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
    <section className="py-10 gradient-hero">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-primary-foreground/10 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <Mail className="h-6 w-6 text-primary-foreground" />
          </div>
          
          <h2 className="text-xl md:text-2xl font-heading font-bold text-primary-foreground mb-2">
            Get Exclusive Deals
          </h2>
          <p className="text-primary-foreground/80 mb-5 text-sm">
            Subscribe to our newsletter and get 10% off your first order
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-primary-foreground border-0 text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className={`h-11 px-5 ${
                isSubscribed
                  ? "bg-accent hover:bg-accent"
                  : "bg-foreground hover:bg-foreground/90"
              } text-card font-semibold`}
              disabled={isSubscribed}
            >
              {isSubscribed ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Subscribed!
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-primary-foreground/60 mt-3">
            By subscribing, you agree to our Privacy Policy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
