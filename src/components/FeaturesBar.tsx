import { Truck, Tag, RotateCcw, Shield, Headphones } from "lucide-react";

const features = [
  { icon: Headphones, text: "Customer Support", subtext: "Quick Response" },
  { icon: Tag, text: "Lowest Price", subtext: "Guaranteed" },
  { icon: Truck, text: "Fast Shipping", subtext: "Nationwide Delivery" },
  { icon: RotateCcw, text: "7 Days Return", subtext: "T&C Apply" },
  { icon: Shield, text: "Secure Payments", subtext: "T&C Apply" },
];

const FeaturesBar = () => {
  return (
    <div className="bg-card border-b border-border py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-4 md:gap-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-3"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <feature.icon className="h-5 w-5 text-primary" />
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
  );
};

export default FeaturesBar;
