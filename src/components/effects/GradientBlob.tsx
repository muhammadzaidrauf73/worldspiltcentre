interface GradientBlobProps {
  className?: string;
  color?: "primary" | "accent";
  size?: "sm" | "md" | "lg";
}

const GradientBlob = ({ 
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
    primary: "from-primary/30 via-primary/20 to-transparent",
    accent: "from-accent/30 via-accent/20 to-transparent",
  };

  return (
    <div
      className={`absolute rounded-full bg-gradient-radial blur-3xl animate-pulse pointer-events-none ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      style={{
        animation: "blob-float 8s ease-in-out infinite",
      }}
    />
  );
};

export default GradientBlob;
