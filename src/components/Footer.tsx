import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle } from "lucide-react";

const Footer = () => {
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
      { name: "Shipping Info", path: "#" },
      { name: "Returns Policy", path: "#" },
      { name: "Warranty", path: "#" },
    ],
    company: [
      { name: "About Us", path: "#" },
      { name: "Blog", path: "#" },
      { name: "Store Locations", path: "#" },
      { name: "Careers", path: "#" },
      { name: "Terms & Conditions", path: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
    { icon: MessageCircle, href: "#", label: "WhatsApp" },
  ];

  return (
    <footer className="bg-foreground text-card" id="contact">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">AC</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">AYAN & CO</h3>
                <p className="text-xs text-card/60 uppercase tracking-wider">Electronics</p>
              </div>
            </Link>
            <p className="text-card/70 text-sm mb-4 max-w-xs">
              Your trusted destination for premium electronics and home appliances. 
              Quality products, lowest prices, exceptional service.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-card/70">
                <Phone className="h-4 w-4 text-primary" />
                <span>0300-4649141</span>
              </div>
              <div className="flex items-center gap-2 text-card/70">
                <Mail className="h-4 w-4 text-primary" />
                <span>support@ayanelectronics.com</span>
              </div>
              <div className="flex items-center gap-2 text-card/70">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Main Market, Lahore, Pakistan</span>
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
            © {new Date().getFullYear()} Ayan & Co Electronics. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
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
        href="https://wa.me/923004649141"
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
