import { useState, useEffect } from "react";
import { X, Gift, Mail, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email" }).max(255);

const POPUP_STORAGE_KEY = "wsc_welcome_popup_shown";
const POPUP_DELAY_MS = 3000; // Show after 3 seconds
const POPUP_COOLDOWN_DAYS = 7; // Don't show again for 7 days

const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAndShowPopup = () => {
      const lastShown = localStorage.getItem(POPUP_STORAGE_KEY);
      
      if (lastShown) {
        const lastShownDate = new Date(parseInt(lastShown));
        const daysSinceShown = (Date.now() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceShown < POPUP_COOLDOWN_DAYS) {
          return; // Don't show popup yet
        }
      }

      // Show popup after delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, POPUP_DELAY_MS);

      return () => clearTimeout(timer);
    };

    checkAndShowPopup();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(POPUP_STORAGE_KEY, Date.now().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({
        title: "Invalid email",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: result.data });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already subscribed!",
          description: "You're already on our list. Check your inbox for exclusive deals!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to subscribe. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Welcome! 🎉",
        description: "You've been subscribed! Check your email for your discount code.",
      });
      handleClose();
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <DialogTitle className="sr-only">Welcome Offer - Subscribe to Newsletter</DialogTitle>
        <div className="relative">
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl" />
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5 rounded-2xl" />
          
          {/* Decorative elements */}
          <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          
          {/* Content */}
          <div className="relative p-8 text-center">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white"
              aria-label="Close popup"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-5">
              <Gift className="h-8 w-8 text-white" />
            </div>

            {/* Discount badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-white font-bold text-sm">EXCLUSIVE OFFER</span>
              <Sparkles className="h-4 w-4 text-yellow-300" />
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
              Get <span className="text-yellow-300">10% OFF</span>
            </h2>
            <p className="text-white/90 text-lg mb-2">
              Your First Order
            </p>
            <p className="text-white/70 text-sm mb-6 max-w-xs mx-auto">
              Subscribe to our newsletter and receive an exclusive discount code plus early access to deals!
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 pr-4 bg-white border-0 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white/50"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background rounded-xl font-semibold text-base shadow-lg"
              >
                {isSubmitting ? (
                  "Subscribing..."
                ) : (
                  <>
                    Claim My Discount
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Footer text */}
            <p className="text-white/50 text-xs mt-4">
              No spam, unsubscribe anytime. By subscribing you agree to our privacy policy.
            </p>

            {/* Skip link */}
            <button
              onClick={handleClose}
              className="text-white/60 text-sm mt-4 hover:text-white/80 transition-colors underline-offset-2 hover:underline"
            >
              No thanks, I'll pay full price
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;
