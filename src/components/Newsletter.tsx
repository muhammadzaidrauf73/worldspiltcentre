import { useState } from "react";
import { Mail, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already subscribed",
            description: "This email is already on our list!",
          });
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast({
          title: "Successfully subscribed!",
          description: "You'll receive our best deals and updates.",
        });
        setEmail("");
        setTimeout(() => setIsSubscribed(false), 3000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-8 sm:py-10 gradient-hero">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-foreground/10 backdrop-blur flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          
          <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-primary-foreground mb-2">
            Get Exclusive Deals
          </h2>
          <p className="text-primary-foreground/80 mb-4 sm:mb-5 text-xs sm:text-sm">
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
                className="pl-10 h-10 sm:h-11 bg-primary-foreground border-0 text-foreground placeholder:text-muted-foreground text-sm"
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className={`h-10 sm:h-11 px-4 sm:px-5 text-sm ${
                isSubscribed
                  ? "bg-accent hover:bg-accent"
                  : "bg-foreground hover:bg-foreground/90"
              } text-card font-semibold`}
              disabled={isSubscribed || isLoading}
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

          <p className="text-[10px] sm:text-xs text-primary-foreground/60 mt-2 sm:mt-3">
            By subscribing, you agree to our Privacy Policy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
