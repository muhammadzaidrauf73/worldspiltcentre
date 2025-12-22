import { Link } from "react-router-dom";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: {
    icon: LucideIcon;
    text: string;
  };
  accentIcon?: LucideIcon;
  secondaryAccentIcon?: LucideIcon;
  linkTo: string;
  linkText?: string;
  className?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
  accentIcon: AccentIcon,
  secondaryAccentIcon: SecondaryAccentIcon,
  linkTo,
  linkText = "View All",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4", className)}>
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Animated icon */}
        <div className="relative group">
          {/* Outer glow */}
          <div className="absolute -inset-3 bg-primary/20 rounded-2xl blur-lg group-hover:bg-primary/30 transition-all duration-500" />
          {/* Rotating border */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-2xl opacity-75 animate-spin" style={{ animationDuration: '8s' }} />
          {/* Icon container */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
            <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground drop-shadow-lg" />
          </div>
          {/* Accent icons */}
          {AccentIcon && (
            <AccentIcon className="absolute -top-2 -right-2 h-5 w-5 text-accent drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
          )}
          {SecondaryAccentIcon && (
            <SecondaryAccentIcon className="absolute -bottom-1 -left-1 h-4 w-4 text-primary/60 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground">
              {title}
            </h2>
            {badge && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border backdrop-blur-sm bg-primary/10 text-primary border-primary/30">
                <badge.icon className="h-3 w-3" />
                {badge.text}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
            {description}
          </p>
        </div>
      </div>
      
      <Link to={linkTo}>
        <Button 
          variant="outline" 
          className="group relative overflow-hidden border-primary/30 bg-background/50 backdrop-blur-sm h-10 sm:h-11 px-5 sm:px-6 rounded-full transition-all duration-300 hover:shadow-lg hover:border-primary hover:bg-primary/5 text-primary"
        >
          <span className="relative z-10 flex items-center">
            {linkText}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Button>
      </Link>
    </div>
  );
}

export default SectionHeader;
