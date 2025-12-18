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
      className="group flex flex-col items-center min-w-[100px] md:min-w-[120px]"
    >
      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-secondary to-muted overflow-hidden shadow-card group-hover:shadow-lg transition-smooth group-hover:-translate-y-1">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5">
            <Icon className="h-10 w-10 text-primary group-hover:scale-110 transition-smooth" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
      </div>
      <div className="mt-3 text-center">
        <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-smooth">
          {name}
        </p>
        <p className="text-xs text-muted-foreground">{count} items</p>
      </div>
    </Link>
  );
};

export default CategoryCard;
