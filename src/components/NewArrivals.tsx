import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";

const newProducts = [
  {
    id: "na1",
    name: "Samsung Bespoke AI Refrigerator",
    brand: "Samsung",
    price: 499999,
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300",
    rating: 4.8,
    reviews: 89,
    badge: "New",
  },
  {
    id: "na2",
    name: "LG InstaView Door-in-Door",
    brand: "LG",
    price: 379999,
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300",
    rating: 4.7,
    reviews: 156,
    badge: "New",
  },
  {
    id: "na3",
    name: "Sony WH-1000XM5 Headphones",
    brand: "Sony",
    price: 69999,
    originalPrice: 79999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
    rating: 4.9,
    reviews: 2341,
    badge: "New",
  },
  {
    id: "na4",
    name: "Samsung Galaxy Watch 6 Pro",
    brand: "Samsung",
    price: 89999,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300",
    rating: 4.6,
    reviews: 567,
    badge: "New",
  },
];

const NewArrivals = () => {
  return (
    <section className="py-8 sm:py-10 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-foreground">
                New Arrivals
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Fresh products just landed
              </p>
            </div>
          </div>
          <Link to="/products?sort=newest">
            <Button variant="ghost" className="text-primary hover:text-primary/80 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
              View All
              <ArrowRight className="ml-1 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {newProducts.map((product, index) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <ProductCard {...product} index={index} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
