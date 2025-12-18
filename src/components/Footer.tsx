import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
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
      { name: "Privacy Policy", path: "/privacy" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Blog", path: "/blog" },
      { name: "Store Locations", path: "/store-locations" },
      { name: "Careers", path: "/careers" },
      { name: "Terms & Conditions", path: "/terms" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: getSetting('facebook_url', ''), label: "Facebook" },
    { icon: Instagram, href: getSetting('instagram_url', ''), label: "Instagram" },
    { icon: Youtube, href: getSetting('youtube_url', ''), label: "YouTube" },
    { icon: MessageCircle, href: getSetting('whatsapp', '') ? `https://wa.me/${getSetting('whatsapp', '').replace(/[^0-9]/g, '')}` : '', label: "WhatsApp" },
  ].filter(s => s.href);

  const whatsappNumber = getSetting('whatsapp', '923004649141').replace(/[^0-9]/g, '');

  return (
    <footer className="bg-foreground text-card" id="contact">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="sm:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3 sm:mb-4">
              <img 
                src="/logo.png" 
                alt={getSetting('company_name', 'World Spilt Centre')} 
                className="h-8 sm:h-10 w-auto object-contain"
              />
              <div>
                <h3 className="font-heading font-bold text-base sm:text-lg">
                  {getSetting('company_name', 'World Spilt Centre').split(' ').map((word, i) => 
                    i === 1 ? <span key={i} className="text-primary">{word} </span> : word + ' '
                  )}
                </h3>
                <p className="text-[10px] sm:text-xs text-card/60 uppercase tracking-wider">
                  {getSetting('company_tagline', 'Electronics')}
                </p>
              </div>
            </Link>
            <p className="text-card/70 text-xs sm:text-sm mb-3 sm:mb-4 max-w-xs">
              Your trusted destination for premium electronics and home appliances. 
              Quality products, lowest prices, exceptional service.
            </p>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-card/70">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span>{getSetting('phone', '0300-4649141')}</span>
              </div>
              <div className="flex items-center gap-2 text-card/70">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm break-all">{getSetting('email', 'support@worldspiltcentre.com')}</span>
              </div>
              <div className="flex items-start gap-2 text-card/70">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-xs sm:text-sm">{getSetting('address', 'Shop # 30 Saleem Complex, Q Block (Ext) Near Kashmir Bakers, Model Town, Lahore')}</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-primary text-sm sm:text-base">Shop</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-xs sm:text-sm text-card/70 hover:text-primary transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-primary text-sm sm:text-base">Support</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-xs sm:text-sm text-card/70 hover:text-primary transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-primary text-sm sm:text-base">Company</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-xs sm:text-sm text-card/70 hover:text-primary transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-card/10 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-card/60 text-center sm:text-left">
            © {new Date().getFullYear()} {getSetting('company_name', 'World Spilt Centre')}. All rights reserved.
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-smooth"
              >
                <social.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* WhatsApp Float Button */}
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-smooth z-50"
      >
        <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
      </a>
    </footer>
  );
};

export default Footer;
