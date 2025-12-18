import { Truck, Tag, RotateCcw, Shield, Headphones } from "lucide-react";

const features = [
  { icon: Headphones, text: "Customer Support", subtext: "Quick Response" },
  { icon: Tag, text: "Lowest Price", subtext: "Guaranteed" },
  { icon: Truck, text: "Fast Shipping", subtext: "Nationwide Delivery" },
  { icon: RotateCcw, text: "7 Days Return", subtext: "T&C Apply" },
  { icon: Shield, text: "Secure Payments", subtext: "T&C Apply" },
];

const FeaturesBar = () => {
  // Duplicate features for seamless loop
  const duplicatedFeatures = [...features, ...features];

  return (
    <div className="bg-card border-b border-border py-4 overflow-hidden relative">
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
      
      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
      
      <div className="relative">
        <div className="flex animate-scroll-x hover:pause-animation">
          {duplicatedFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-6 md:px-8 shrink-0 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                <feature.icon className="h-5 w-5 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
              </div>
              <div className="transition-transform duration-300 group-hover:translate-x-1">
                <p className="font-semibold text-foreground text-sm whitespace-nowrap">{feature.text}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{feature.subtext}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesBar;
