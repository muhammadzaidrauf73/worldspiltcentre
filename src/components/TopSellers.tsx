import { Link } from "react-router-dom";
import { Trophy, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";

const topSellerProducts = [
  {
    id: "ts1",
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    price: 239999,
    originalPrice: 279999,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300",
    rating: 4.9,
    reviews: 2456,
    badge: "Best Seller",
  },
  {
    id: "ts2",
    name: "Sony 65\" BRAVIA XR OLED TV",
    brand: "Sony",
    price: 359999,
    originalPrice: 439999,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300",
    rating: 4.8,
    reviews: 892,
  },
  {
    id: "ts3",
    name: "Dyson V15 Detect Vacuum",
    brand: "Dyson",
    price: 129999,
    originalPrice: 149999,
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=300",
    rating: 4.7,
    reviews: 1234,
  },
  {
    id: "ts4",
    name: "Apple MacBook Pro 14\"",
    brand: "Apple",
    price: 399999,
    originalPrice: 439999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300",
    rating: 4.9,
    reviews: 3421,
    badge: "Top Rated",
  },
];

const TopSellers = () => {
  return (
    <section className="py-10 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                Top Sellers
              </h2>
              <p className="text-sm text-muted-foreground">
                Most popular products this month
              </p>
            </div>
          </div>
          <Link to="/products?sort=bestselling">
            <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {topSellerProducts.map((product, index) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <ProductCard {...product} index={index} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopSellers;
