import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { ProductGridSkeleton } from "./ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const NewArrivals = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["new-arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_new_arrival", true)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-8 sm:py-10 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <ProductGridSkeleton count={4} />
        </div>
      </section>
    );
  }

  if (!products?.length) return null;

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
          {products.map((product, index) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <ProductCard
                id={product.id}
                name={product.name}
                brand={product.brand}
                price={product.price}
                originalPrice={product.original_price || undefined}
                image={product.image_url || "/placeholder.svg"}
                rating={product.rating || 0}
                reviews={product.reviews_count || 0}
                badge="New"
                index={index}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
