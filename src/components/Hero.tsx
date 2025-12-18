import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, Headphones, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const features = [
    { icon: Truck, text: "Free Delivery", subtext: "Orders over $99" },
    { icon: Shield, text: "2 Year Warranty", subtext: "On all products" },
    { icon: Headphones, text: "24/7 Support", subtext: "Expert assistance" },
    { icon: CreditCard, text: "Secure Payment", subtext: "100% protected" },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Main Hero */}
      <div className="gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Content */}
            <div className="text-primary-foreground space-y-6 animate-fade-in">
              <span className="inline-block px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur text-sm font-semibold">
                🎉 Grand Opening Sale - Up to 50% Off
              </span>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
                Premium Electronics at 
                <span className="text-accent"> Unbeatable Prices</span>
              </h1>
              <p className="text-lg text-primary-foreground/80 max-w-md">
                Discover the latest in home appliances, TVs, smartphones, and more. 
                Quality guaranteed with the best after-sales service.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-glow">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="#categories">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Browse Categories
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image/Graphics */}
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-transparent rounded-3xl" />
              <div className="relative bg-primary-foreground/5 backdrop-blur rounded-3xl p-8 border border-primary-foreground/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-primary-foreground/10 rounded-2xl p-6 hover-lift">
                      <p className="text-4xl mb-2">📺</p>
                      <p className="text-primary-foreground font-semibold">Smart TVs</p>
                      <p className="text-primary-foreground/60 text-sm">From $299</p>
                    </div>
                    <div className="bg-primary-foreground/10 rounded-2xl p-6 hover-lift">
                      <p className="text-4xl mb-2">🧊</p>
                      <p className="text-primary-foreground font-semibold">Refrigerators</p>
                      <p className="text-primary-foreground/60 text-sm">From $499</p>
                    </div>
                  </div>
                  <div className="space-y-4 mt-8">
                    <div className="bg-primary-foreground/10 rounded-2xl p-6 hover-lift">
                      <p className="text-4xl mb-2">❄️</p>
                      <p className="text-primary-foreground font-semibold">Air Conditioners</p>
                      <p className="text-primary-foreground/60 text-sm">From $399</p>
                    </div>
                    <div className="bg-accent/20 rounded-2xl p-6 hover-lift border border-accent/30">
                      <p className="text-4xl mb-2">🔥</p>
                      <p className="text-primary-foreground font-semibold">Hot Deals</p>
                      <p className="text-accent text-sm font-bold">Up to 50% OFF</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Bar */}
      <div className="bg-card border-b border-border py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-smooth"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{feature.text}</p>
                  <p className="text-xs text-muted-foreground">{feature.subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
