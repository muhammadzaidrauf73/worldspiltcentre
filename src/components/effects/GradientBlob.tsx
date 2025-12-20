import { memo } from "react";

interface GradientBlobProps {
  className?: string;
  color?: "primary" | "accent";
  size?: "sm" | "md" | "lg";
}

const GradientBlob = memo(({ 
  className = "", 
  color = "primary",
  size = "md" 
}: GradientBlobProps) => {
  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-64 h-64",
    lg: "w-96 h-96",
  };

  const colorClasses = {
    primary: "from-primary/20 via-primary/10 to-transparent",
    accent: "from-accent/20 via-accent/10 to-transparent",
  };

  return (
    <div
      className={`absolute rounded-full bg-gradient-radial blur-3xl pointer-events-none will-change-transform ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      aria-hidden="true"
    />
  );
});

GradientBlob.displayName = "GradientBlob";

export default GradientBlob;
