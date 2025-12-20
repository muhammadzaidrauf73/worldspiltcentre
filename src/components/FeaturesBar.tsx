import { memo } from "react";
import { Truck, Tag, RotateCcw, Shield, Headphones } from "lucide-react";

const features = [
  { icon: Headphones, text: "Customer Support", subtext: "Quick Response" },
  { icon: Tag, text: "Lowest Price", subtext: "Guaranteed" },
  { icon: Truck, text: "Fast Shipping", subtext: "Nationwide Delivery" },
  { icon: RotateCcw, text: "7 Days Return", subtext: "T&C Apply" },
  { icon: Shield, text: "Secure Payments", subtext: "T&C Apply" },
];

const FeaturesBar = memo(() => {
  // Duplicate features for seamless loop
  const duplicatedFeatures = [...features, ...features];

  return (
    <div className="bg-card border-b border-border py-2 md:py-4 overflow-hidden relative">
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
      
      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
      
      <div className="relative">
        <div className="flex animate-ticker hover:pause-animation will-change-transform">
          {duplicatedFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 md:gap-3 px-4 md:px-8 shrink-0"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <feature.icon className="h-4 w-4 md:h-4.5 md:w-4.5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-xs md:text-sm whitespace-nowrap">{feature.text}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">{feature.subtext}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

FeaturesBar.displayName = "FeaturesBar";

export default FeaturesBar;
