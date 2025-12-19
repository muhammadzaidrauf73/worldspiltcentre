import { Truck, Tag, RotateCcw, Shield, Headphones } from "lucide-react";

const features = [
  { icon: Headphones, text: "Customer Support", subtext: "Quick Response", style: "icon-btn-blob" },
  { icon: Tag, text: "Lowest Price", subtext: "Guaranteed", style: "icon-btn-blob-alt" },
  { icon: Truck, text: "Fast Shipping", subtext: "Nationwide Delivery", style: "icon-btn-blob" },
  { icon: RotateCcw, text: "7 Days Return", subtext: "T&C Apply", style: "icon-btn-blob-alt" },
  { icon: Shield, text: "Secure Payments", subtext: "T&C Apply", style: "icon-btn-blob" },
];

const FeaturesBar = () => {
  // Duplicate features for seamless loop
  const duplicatedFeatures = [...features, ...features];

  return (
    <div className="bg-card border-b border-border py-2 md:py-5 overflow-hidden relative">
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
      
      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
      
      <div className="relative">
        <div className="flex animate-scroll-x hover:pause-animation">
          {duplicatedFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 md:gap-4 px-4 md:px-10 shrink-0 group cursor-pointer"
            >
              <div className={`icon-btn ${feature.style} shrink-0 !w-8 !h-8 md:!w-10 md:!h-10`}>
                <feature.icon className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="transition-transform duration-300 group-hover:translate-x-1">
                <p className="font-semibold text-foreground text-xs md:text-sm whitespace-nowrap">{feature.text}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">{feature.subtext}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesBar;
