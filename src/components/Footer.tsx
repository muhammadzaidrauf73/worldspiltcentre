import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
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
      { name: "Warranty", path: "/warranty" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Blog", path: "/blog" },
      { name: "Store Locations", path: "/store-locations" },
      { name: "Careers", path: "/careers" },
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms", path: "/terms" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: getSetting('facebook_url', ''), label: "Facebook" },
    { icon: Instagram, href: getSetting('instagram_url', ''), label: "Instagram" },
    { icon: Youtube, href: getSetting('youtube_url', ''), label: "YouTube" },
    { icon: MessageCircle, href: getSetting('whatsapp', '') ? `https://wa.me/${getSetting('whatsapp', '').replace(/[^0-9]/g, '')}` : '', label: "WhatsApp" },
  ].filter(s => s.href);

  return (
    <footer className="bg-foreground text-card" id="contact">
      <div className="container mx-auto px-4 py-6">
        {/* Top Section - Logo & Contact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-card/10">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt={getSetting('company_name', 'World Spilt Centre')} 
              className="h-8 w-[35px] object-contain"
              width={35}
              height={32}
            />
            <div>
              <h3 className="font-heading font-bold text-sm text-card">
                {getSetting('company_name', 'World Spilt Centre').split(' ').map((word, i) => 
                  i === 1 ? <span key={i} className="text-primary">{word} </span> : word + ' '
                )}
              </h3>
              <p className="text-[10px] text-card/60 uppercase tracking-wider">
                {getSetting('company_tagline', 'Electronics')}
              </p>
            </div>
          </Link>
          
          {/* Contact Info - Horizontal on Desktop */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-card/70">
            <a href={`tel:${getSetting('phone', '0300-4649141')}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>{getSetting('phone', '0300-4649141')}</span>
            </a>
            <a href={`mailto:${getSetting('email', 'support@worldspiltcentre.com')}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">{getSetting('email', 'support@worldspiltcentre.com')}</span>
              <span className="sm:hidden">Email Us</span>
            </a>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6">
          {/* Shop Links */}
          <div>
            <h4 className="font-semibold text-primary text-xs mb-3">Shop</h4>
            <ul className="space-y-1.5">
              {footerLinks.shop.slice(0, 5).map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-[11px] text-card/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-primary text-xs mb-3">Support</h4>
            <ul className="space-y-1.5">
              {footerLinks.support.slice(0, 5).map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-[11px] text-card/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-primary text-xs mb-3">Company</h4>
            <ul className="space-y-1.5">
              {footerLinks.company.slice(0, 5).map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-[11px] text-card/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-primary text-xs mb-3">Newsletter</h4>
            <p className="text-[11px] text-card/70 mb-3">
              Get exclusive deals & updates straight to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-xs bg-card/10 border-card/20 text-card placeholder:text-card/50 flex-1"
                required
              />
              <Button 
                type="submit" 
                size="sm" 
                className="h-8 px-3 bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
            
            {/* Social Links */}
            <div className="flex items-center gap-2 mt-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-card/10 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
            <p className="text-[10px] text-card/60">
              {getSetting('address', 'Shop # 30 Saleem Complex, Q Block (Ext) Near Kashmir Bakers, Model Town, Lahore')}
            </p>
          </div>
          
          <p className="text-[10px] text-card/60">
            © {new Date().getFullYear()} {getSetting('company_name', 'World Spilt Centre')}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;