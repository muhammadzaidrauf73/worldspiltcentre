import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle, Send, ArrowRight, Sparkles } from "lucide-react";
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
    <footer className="bg-foreground relative overflow-hidden" id="contact">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 py-12 relative">
        {/* Top Section - Newsletter & Logo */}
        <div className="grid md:grid-cols-2 gap-8 pb-10 border-b border-card/10">
          {/* Logo & Description */}
          <div>
            <Link to="/" className="inline-block mb-4 group">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <img 
                  src="/logo.png" 
                  alt={getSetting('company_name', 'World Spilt Centre')} 
                  className="h-14 w-auto object-contain relative"
                  width={140}
                  height={56}
                />
              </div>
            </Link>
            <p className="text-sm text-card/60 max-w-md leading-relaxed">
              Your trusted destination for premium electronics. We offer the best brands at competitive prices with exceptional customer service.
            </p>
            
            {/* Contact Row */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <a href={`tel:${getSetting('phone', '0300-4649141')}`} className="flex items-center gap-2 text-card/70 hover:text-primary transition-colors group">
                <div className="w-9 h-9 rounded-full bg-card/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{getSetting('phone', '0300-4649141')}</span>
              </a>
              <a href={`mailto:${getSetting('email', 'support@worldspiltcentre.com')}`} className="flex items-center gap-2 text-card/70 hover:text-primary transition-colors group">
                <div className="w-9 h-9 rounded-full bg-card/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium hidden sm:inline">{getSetting('email', 'support@worldspiltcentre.com')}</span>
                <span className="text-sm font-medium sm:hidden">Email Us</span>
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-card/5 rounded-2xl p-6 border border-card/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-bold text-card text-lg">Subscribe to Newsletter</h4>
            </div>
            <p className="text-sm text-card/60 mb-4">
              Get exclusive deals, new arrivals & special offers straight to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-card/10 border-card/20 text-card placeholder:text-card/40 flex-1 rounded-xl focus:border-primary"
                required
              />
              <Button 
                type="submit" 
                className="h-11 px-5 bg-primary hover:bg-primary/90 rounded-xl font-semibold"
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </form>
            
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-5">
              <span className="text-xs text-card/50 font-medium">Follow Us:</span>
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full bg-card/10 flex items-center justify-center transition-all duration-300 ${social.color} hover:text-white hover:scale-110`}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 py-10">
          {/* Shop Links */}
          <div>
            <h4 className="font-bold text-card text-sm mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Shop
            </h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-card/60 hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-bold text-card text-sm mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-card/60 hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-card text-sm mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-card/60 hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Store Info */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h4 className="font-bold text-card text-sm mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Visit Our Store
            </h4>
            <div className="bg-card/5 rounded-xl p-4 border border-card/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-card/80 leading-relaxed">
                    {getSetting('address', 'Shop # 30 Saleem Complex, Q Block (Ext) Near Kashmir Bakers, Model Town, Lahore')}
                  </p>
                  <Link 
                    to="/store-locations" 
                    className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1 font-medium"
                  >
                    View All Locations <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-card/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-card/50">
            © {new Date().getFullYear()} {getSetting('company_name', 'World Spilt Centre')}. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-card/50 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span className="text-card/20">|</span>
            <Link to="/terms" className="text-xs text-card/50 hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <span className="text-card/20">|</span>
            <Link to="/refund-policy" className="text-xs text-card/50 hover:text-primary transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
