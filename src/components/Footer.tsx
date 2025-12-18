import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    shop: [
      { name: "All Products", path: "/products" },
      { name: "TVs & Audio", path: "/products?category=TVs" },
      { name: "Refrigerators", path: "/products?category=Refrigerators" },
      { name: "Washing Machines", path: "/products?category=Washing%20Machines" },
      { name: "Air Conditioners", path: "/products?category=Air%20Conditioners" },
    ],
    support: [
      { name: "Contact Us", path: "#contact" },
      { name: "FAQs", path: "#faq" },
      { name: "Shipping Info", path: "#" },
      { name: "Returns", path: "#" },
      { name: "Warranty", path: "#" },
    ],
    company: [
      { name: "About Us", path: "#" },
      { name: "Careers", path: "#" },
      { name: "Store Locations", path: "#" },
      { name: "Blog", path: "#" },
      { name: "Press", path: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground" id="contact">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">A</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">Ayan & Company</h3>
                <p className="text-xs text-primary-foreground/60">Electronics</p>
              </div>
            </Link>
            <p className="text-primary-foreground/70 text-sm mb-4 max-w-xs">
              Your trusted destination for premium electronics and home appliances. 
              Quality products, unbeatable prices, exceptional service.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-primary-foreground/70">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/70">
                <Mail className="h-4 w-4" />
                <span>support@ayanelectronics.com</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/70">
                <MapPin className="h-4 w-4" />
                <span>123 Tech Street, Silicon Valley</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Ayan & Company Electronics. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-smooth"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
