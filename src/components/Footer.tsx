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
      { name: "Contact Us", path: "#contact" },
      { name: "FAQs", path: "#faq" },
      { name: "Shipping Info", path: getSetting('shipping_info_url', '#') },
      { name: "Returns Policy", path: getSetting('returns_policy_url', '#') },
      { name: "Warranty", path: getSetting('warranty_url', '#') },
      { name: "Privacy Policy", path: getSetting('privacy_policy_url', '#') },
    ],
    company: [
      { name: "About Us", path: getSetting('about_us_url', '#') },
      { name: "Blog", path: getSetting('blog_url', '#') },
      { name: "Store Locations", path: getSetting('store_locations_url', '#') },
      { name: "Careers", path: getSetting('careers_url', '#') },
      { name: "Terms & Conditions", path: getSetting('terms_conditions_url', '#') },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: getSetting('facebook_url', '#'), label: "Facebook" },
    { icon: Instagram, href: getSetting('instagram_url', '#'), label: "Instagram" },
    { icon: Youtube, href: getSetting('youtube_url', '#'), label: "YouTube" },
    { icon: MessageCircle, href: getSetting('whatsapp_url', '#'), label: "WhatsApp" },
  ];

  const whatsappNumber = getSetting('contact_phone', '923004649141').replace(/[^0-9]/g, '');

  return (
    <footer className="bg-foreground text-card" id="contact">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src="/logo.png" 
                alt={getSetting('company_name', 'World Spilt Centre')} 
                className="h-10 w-auto object-contain"
              />
              <div>
                <h3 className="font-heading font-bold text-lg">
                  {getSetting('company_name', 'World Spilt Centre').split(' ').map((word, i) => 
                    i === 1 ? <span key={i} className="text-primary">{word} </span> : word + ' '
                  )}
                </h3>
                <p className="text-xs text-card/60 uppercase tracking-wider">
                  {getSetting('company_tagline', 'Electronics')}
                </p>
              </div>
            </Link>
            <p className="text-card/70 text-sm mb-4 max-w-xs">
              Your trusted destination for premium electronics and home appliances. 
              Quality products, lowest prices, exceptional service.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-card/70">
                <Phone className="h-4 w-4 text-primary" />
                <span>{getSetting('contact_phone', '0300-4649141')}</span>
              </div>
              <div className="flex items-center gap-2 text-card/70">
                <Mail className="h-4 w-4 text-primary" />
                <span>{getSetting('contact_email', 'support@ayanelectronics.com')}</span>
              </div>
              <div className="flex items-start gap-2 text-card/70">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{getSetting('contact_address', 'Shop # 30 Saleem Complex, Q Block (Ext) Near Kashmir Bakers, Model Town, Lahore')}</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold mb-4 text-primary">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-card/70 hover:text-primary transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4 text-primary">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-card/70 hover:text-primary transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4 text-primary">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-card/70 hover:text-primary transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-card/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-card/60">
            © {new Date().getFullYear()} {getSetting('company_name', 'World Spilt Centre')}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-smooth"
              >
                <social.icon className="h-4 w-4" />
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-smooth z-50"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </a>
    </footer>
  );
};

export default Footer;
