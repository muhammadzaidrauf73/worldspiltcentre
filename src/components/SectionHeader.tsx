import { Link } from "react-router-dom";
import { ArrowRight, Star, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ColorTheme = "violet" | "amber" | "emerald" | "blue" | "rose";

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
  theme?: ColorTheme;
  className?: string;
}

const themeConfig = {
  violet: {
    gradient: "from-violet-500 via-fuchsia-500 to-pink-500",
    textGradient: "from-violet-600 via-fuchsia-500 to-pink-500 dark:from-violet-400 dark:via-fuchsia-400 dark:to-pink-400",
    badgeBg: "from-violet-500/20 to-pink-500/20 dark:from-violet-500/30 dark:to-pink-500/30",
    badgeText: "text-violet-700 dark:text-violet-300",
    badgeBorder: "border-violet-300/50 dark:border-violet-500/30",
    buttonBorder: "border-violet-300/50 dark:border-violet-500/30",
    buttonText: "text-violet-600 dark:text-violet-300",
    buttonHover: "hover:border-violet-500 hover:shadow-violet-500/20",
    shadow: "shadow-violet-500/40",
    glowFrom: "from-violet-400/20",
    glowTo: "to-fuchsia-400/20",
    dotGradient: "from-violet-500 to-fuchsia-500",
    dotShadow: "shadow-violet-500/50",
  },
  amber: {
    gradient: "from-amber-400 via-orange-500 to-red-500",
    textGradient: "from-amber-600 via-orange-500 to-red-500 dark:from-amber-400 dark:via-orange-400 dark:to-red-400",
    badgeBg: "from-orange-500/20 to-red-500/20 dark:from-orange-500/30 dark:to-red-500/30",
    badgeText: "text-orange-700 dark:text-orange-300",
    badgeBorder: "border-orange-300/50 dark:border-orange-500/30",
    buttonBorder: "border-amber-300/50 dark:border-amber-500/30",
    buttonText: "text-amber-700 dark:text-amber-300",
    buttonHover: "hover:border-orange-500 hover:shadow-orange-500/20",
    shadow: "shadow-orange-500/40",
    glowFrom: "from-amber-400/20",
    glowTo: "to-orange-400/20",
    dotGradient: "from-amber-500 to-orange-500",
    dotShadow: "shadow-orange-500/50",
  },
  emerald: {
    gradient: "from-emerald-400 via-green-500 to-teal-500",
    textGradient: "from-emerald-600 via-green-500 to-teal-600 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400",
    badgeBg: "from-amber-500/20 to-yellow-500/20 dark:from-amber-500/30 dark:to-yellow-500/30",
    badgeText: "text-amber-700 dark:text-amber-300",
    badgeBorder: "border-amber-300/50 dark:border-amber-500/30",
    buttonBorder: "border-emerald-300/50 dark:border-emerald-500/30",
    buttonText: "text-emerald-700 dark:text-emerald-300",
    buttonHover: "hover:border-emerald-500 hover:shadow-emerald-500/20",
    shadow: "shadow-emerald-500/40",
    glowFrom: "from-emerald-400/20",
    glowTo: "to-green-400/20",
    dotGradient: "from-emerald-500 to-green-500",
    dotShadow: "shadow-emerald-500/50",
  },
  blue: {
    gradient: "from-blue-400 via-cyan-500 to-teal-500",
    textGradient: "from-blue-600 via-cyan-500 to-teal-600 dark:from-blue-400 dark:via-cyan-400 dark:to-teal-400",
    badgeBg: "from-blue-500/20 to-cyan-500/20 dark:from-blue-500/30 dark:to-cyan-500/30",
    badgeText: "text-blue-700 dark:text-blue-300",
    badgeBorder: "border-blue-300/50 dark:border-blue-500/30",
    buttonBorder: "border-blue-300/50 dark:border-blue-500/30",
    buttonText: "text-blue-700 dark:text-blue-300",
    buttonHover: "hover:border-blue-500 hover:shadow-blue-500/20",
    shadow: "shadow-blue-500/40",
    glowFrom: "from-blue-400/20",
    glowTo: "to-cyan-400/20",
    dotGradient: "from-blue-500 to-cyan-500",
    dotShadow: "shadow-blue-500/50",
  },
  rose: {
    gradient: "from-rose-400 via-pink-500 to-fuchsia-500",
    textGradient: "from-rose-600 via-pink-500 to-fuchsia-600 dark:from-rose-400 dark:via-pink-400 dark:to-fuchsia-400",
    badgeBg: "from-rose-500/20 to-pink-500/20 dark:from-rose-500/30 dark:to-pink-500/30",
    badgeText: "text-rose-700 dark:text-rose-300",
    badgeBorder: "border-rose-300/50 dark:border-rose-500/30",
    buttonBorder: "border-rose-300/50 dark:border-rose-500/30",
    buttonText: "text-rose-700 dark:text-rose-300",
    buttonHover: "hover:border-rose-500 hover:shadow-rose-500/20",
    shadow: "shadow-rose-500/40",
    glowFrom: "from-rose-400/20",
    glowTo: "to-pink-400/20",
    dotGradient: "from-rose-500 to-pink-500",
    dotShadow: "shadow-rose-500/50",
  },
};

export function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
  accentIcon: AccentIcon,
  secondaryAccentIcon: SecondaryAccentIcon,
  linkTo,
  linkText = "View All",
  theme = "violet",
  className,
}: SectionHeaderProps) {
  const config = themeConfig[theme];

  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4", className)}>
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Premium animated icon */}
        <div className="relative group">
          {/* Outer glow */}
          <div className={cn(
            "absolute -inset-3 rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-500",
            `bg-gradient-to-r ${config.gradient}`
          )} />
          {/* Rotating border */}
          <div className={cn(
            "absolute -inset-1 rounded-2xl opacity-75 animate-spin",
            `bg-gradient-to-r ${config.gradient}`
          )} style={{ animationDuration: '8s' }} />
          {/* Icon container */}
          <div className={cn(
            "relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-2xl",
            `bg-gradient-to-br ${config.gradient} ${config.shadow}`
          )}>
            <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
          </div>
          {/* Accent icons */}
          {AccentIcon && (
            <AccentIcon className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
          )}
          {SecondaryAccentIcon && (
            <SecondaryAccentIcon className="absolute -bottom-1 -left-1 h-4 w-4 text-white/80 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
              <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", config.textGradient)}>
                {title}
              </span>
            </h2>
            {badge && (
              <span className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border backdrop-blur-sm",
                `bg-gradient-to-r ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`
              )}>
                <badge.icon className="h-3 w-3" />
                {badge.text}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 flex items-center gap-2">
            <span className={cn(
              "inline-block w-2 h-2 rounded-full animate-pulse shadow-lg",
              `bg-gradient-to-r ${config.dotGradient} ${config.dotShadow}`
            )} />
            {description}
          </p>
        </div>
      </div>
      
      <Link to={linkTo}>
        <Button 
          variant="outline" 
          className={cn(
            "group relative overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-sm h-10 sm:h-11 px-5 sm:px-6 rounded-full transition-all duration-300 hover:shadow-lg",
            config.buttonBorder,
            config.buttonText,
            config.buttonHover
          )}
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
