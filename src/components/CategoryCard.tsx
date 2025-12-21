import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, memo } from "react";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  count: number;
  image?: string;
}

const CategoryCard = memo(({ name, icon: Icon, count, image }: CategoryCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      to={`/products?category=${encodeURIComponent(name)}`}
      className="group flex flex-col items-center min-w-[70px] sm:min-w-[80px] md:min-w-0 md:w-full"
    >
      {/* Circular Image Container */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary shadow-card group-hover:shadow-lg transition-smooth">
        {image && !imageError ? (
          <>
            {/* Skeleton placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-secondary animate-pulse" />
            )}
            <img
              src={image}
              alt={name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover group-hover:scale-110 transition-smooth ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary group-hover:scale-110 transition-smooth" />
          </div>
        )}
      </div>
      <div className="mt-1.5 sm:mt-2 text-center">
        <p className="font-medium text-foreground text-xs sm:text-sm group-hover:text-primary transition-smooth line-clamp-2 max-w-[80px] sm:max-w-none">
          {name}
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{count} items</p>
      </div>
    </Link>
  );
});

CategoryCard.displayName = "CategoryCard";

export default CategoryCard;
