import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  count: number;
  image?: string;
}

const CategoryCard = ({ name, icon: Icon, count, image }: CategoryCardProps) => {
  return (
    <Link
      to={`/products?category=${encodeURIComponent(name)}`}
      className="group flex flex-col items-center min-w-[100px] md:min-w-[110px]"
    >
      {/* Circular Image Container */}
      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-border group-hover:border-primary shadow-card group-hover:shadow-lg transition-smooth">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-smooth" />
          </div>
        )}
      </div>
      <div className="mt-2 text-center">
        <p className="font-medium text-foreground text-sm group-hover:text-primary transition-smooth line-clamp-2">
          {name}
        </p>
        <p className="text-xs text-muted-foreground">{count} items</p>
      </div>
    </Link>
  );
};

export default CategoryCard;
