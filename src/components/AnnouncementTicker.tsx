import { Truck, Tag, RotateCcw, Shield, Headphones } from "lucide-react";

const features = [
  { icon: Truck, text: "Fast Shipping", subtext: "Nationwide Delivery" },
  { icon: Tag, text: "Lowest Price", subtext: "Guaranteed" },
  { icon: RotateCcw, text: "7 Days Return", subtext: "T&C Apply" },
  { icon: Shield, text: "Secure Payments", subtext: "T&C Apply" },
  { icon: Headphones, text: "Customer Support", subtext: "Quick Response" },
];

const AnnouncementTicker = () => {
  return (
    <div className="gradient-ticker py-3 overflow-hidden">
      <div className="animate-ticker flex whitespace-nowrap">
        {/* Double the items for seamless loop */}
        {[...features, ...features].map((feature, index) => (
          <div
            key={index}
            className="flex items-center gap-2 mx-8 text-ticker-foreground"
          >
            <feature.icon className="h-5 w-5 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{feature.text}</span>
              <span className="text-xs opacity-80">{feature.subtext}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementTicker;
