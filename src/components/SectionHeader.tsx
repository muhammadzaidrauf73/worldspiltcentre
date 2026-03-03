import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  badge?: {
    icon: LucideIcon;
    text: string;
  };
  accentIcon?: LucideIcon;
  secondaryAccentIcon?: LucideIcon;
  linkTo?: string;
  linkText?: string;
  className?: string;
}

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(({
  title,
  linkTo,
  linkText = "View All",
  className,
}, ref) => {
  return (
    <div ref={ref} className={cn("flex justify-between items-center mb-4", className)}>
      <h2 className="text-lg sm:text-xl font-bold text-foreground">
        {title}
      </h2>
      
      {linkTo && (
        <Link 
          to={linkTo}
          className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
        >
          {linkText}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
});

SectionHeader.displayName = "SectionHeader";

export default SectionHeader;
