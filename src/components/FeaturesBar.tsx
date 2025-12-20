import { memo } from "react";

// Import GIF icons
import lowestPriceIcon from "@/assets/features/lowest-price.gif";
import customerSupportIcon from "@/assets/features/customer-support.gif";
import securePaymentIcon from "@/assets/features/secure-payment.gif";
import returnIcon from "@/assets/features/7-day-return.gif";
import fastShippingIcon from "@/assets/features/fast-shipping.gif";

const features = [
  { icon: customerSupportIcon, text: "24/7 Support", subtext: "Quick Response" },
  { icon: lowestPriceIcon, text: "Lowest Price", subtext: "Guaranteed" },
  { icon: fastShippingIcon, text: "Fast Shipping", subtext: "Nationwide Delivery" },
  { icon: returnIcon, text: "7 Days Return", subtext: "T&C Apply" },
  { icon: securePaymentIcon, text: "Secure Payments", subtext: "100% Protected" },
];

const FeaturesBar = memo(() => {
  // Duplicate features for seamless loop
  const duplicatedFeatures = [...features, ...features];

  return (
    <div className="bg-card border-b border-border py-3 md:py-4 overflow-hidden relative">
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
      
      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
      
      <div className="relative">
        <div className="flex animate-ticker hover:pause-animation will-change-transform">
          {duplicatedFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 md:gap-4 px-5 md:px-10 shrink-0"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 p-1.5">
                <img 
                  src={feature.icon} 
                  alt={feature.text}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm md:text-base whitespace-nowrap">{feature.text}</p>
                <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">{feature.subtext}</p>
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
