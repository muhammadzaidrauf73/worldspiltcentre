import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MessageCircle, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email" }).max(255);

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ['company-settings-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('key, value');
      if (error) throw error;
      return data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string | null>) || {};
    },
  });

  const getSetting = (key: string, fallback: string = '') => settings?.[key] || fallback;

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
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
          title: "Already subscribed",
          description: "This email is already on our list!",
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
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
    }
    
    setIsSubmitting(false);
  };

  const footerLinks = {
    shop: [
      { name: "All Products", path: "/products" },
      { name: "LED TVs", path: "/products?category=LED%20TV" },
      { name: "Refrigerators", path: "/products?category=Refrigerator" },
      { name: "Washing Machines", path: "/products?category=Washing%20Machines" },
      { name: "Air Conditioners", path: "/products?category=Air%20Conditioner" },
    ],
    support: [
      { name: "Contact Us", path: "/contact" },
      { name: "FAQs", path: "/#faq" },
      { name: "Shipping Info", path: "/shipping" },
      { name: "Returns Policy", path: "/returns" },
      { name: "Refund Policy", path: "/refund-policy" },
      { name: "Warranty", path: "/warranty" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Blog", path: "/blog" },
      { name: "Store Locations", path: "/store-locations" },
      { name: "Careers", path: "/careers" },
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms of Service", path: "/terms" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: getSetting('facebook_url', ''), label: "Facebook", color: "hover:bg-blue-600" },
    { icon: Instagram, href: getSetting('instagram_url', ''), label: "Instagram", color: "hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500" },
    { icon: Youtube, href: getSetting('youtube_url', ''), label: "YouTube", color: "hover:bg-red-600" },
    { icon: MessageCircle, href: getSetting('whatsapp', '') ? `https://wa.me/${getSetting('whatsapp', '').replace(/[^0-9]/g, '')}` : '', label: "WhatsApp", color: "hover:bg-green-600" },
  ].filter(s => s.href);

  return (
    <footer className="bg-foreground relative" id="contact">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-4 py-8 relative">
        {/* Main Footer - Single Row Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 pb-6 border-b border-card/10">
          {/* Company Info */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <h3 className="font-bold text-card text-base mb-2">{getSetting('company_name', 'World Spilt Centre')}</h3>
            <p className="text-xs text-card/50 mb-3 max-w-sm">Your trusted destination for premium electronics at competitive prices.</p>
            <div className="flex items-center gap-3 mb-3">
              <a href={`tel:${getSetting('phone', '0300-4649141')}`} className="flex items-center gap-1.5 text-card/60 hover:text-primary transition-colors text-xs">
                <Phone className="h-3.5 w-3.5 text-primary" />
                {getSetting('phone', '0300-4649141')}
              </a>
              <a href={`mailto:${getSetting('email', 'support@worldspiltcentre.com')}`} className="flex items-center gap-1.5 text-card/60 hover:text-primary transition-colors text-xs">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">{getSetting('email', 'support@worldspiltcentre.com')}</span>
                <span className="sm:hidden">Email</span>
              </a>
            </div>
            {/* Newsletter Inline */}
            <form onSubmit={handleNewsletterSubmit} className="flex gap-1.5 max-w-sm">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-xs bg-card/10 border-card/20 text-card placeholder:text-card/40 flex-1 rounded-lg focus:border-primary"
                required
              />
              <Button type="submit" className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 rounded-lg" disabled={isSubmitting}>
                <Send className="h-3 w-3" />
              </Button>
            </form>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold text-card text-xs mb-3 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-1.5">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-xs text-card/50 hover:text-primary transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-card text-xs mb-3 uppercase tracking-wider">Support</h4>
            <ul className="space-y-1.5">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-xs text-card/50 hover:text-primary transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-card text-xs mb-3 uppercase tracking-wider">Company</h4>
            <ul className="space-y-1.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-xs text-card/50 hover:text-primary transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-card/40">© {new Date().getFullYear()} {getSetting('company_name', 'World Spilt Centre')}</p>
            {socialLinks.map((social) => (
              <a key={social.label} href={social.href} aria-label={social.label} target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-card/10 flex items-center justify-center text-card/50 hover:text-white hover:scale-110 transition-all">
                <social.icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-card/40">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <span className="text-card/20">·</span>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <span className="text-card/20">·</span>
            <Link to="/refund-policy" className="hover:text-primary transition-colors">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
