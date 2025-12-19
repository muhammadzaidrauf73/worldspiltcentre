import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingBag, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const WishlistTab = () => {
  const { user } = useAuth();
  const { toggleWishlist, isToggling } = useWishlist();

  const { data: wishlistProducts = [], isLoading } = useQuery({
    queryKey: ["wishlist-products", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get wishlist items
      const { data: wishlistItems, error: wishlistError } = await supabase
        .from("wishlist_items")
        .select("product_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (wishlistError) throw wishlistError;
      if (!wishlistItems?.length) return [];

      // Then get product details
      const productIds = wishlistItems.map((item) => item.product_id);
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, brand, price, original_price, image_url, slug")
        .in("id", productIds);

      if (productsError) throw productsError;
      return products || [];
    },
    enabled: !!user,
  });

  const handleAddToCart = async (productId: string, productName: string) => {
    if (!user) return;

    const { error } = await supabase.from("cart_items").upsert(
      {
        user_id: user.id,
        product_id: productId,
        quantity: 1,
      },
      { onConflict: "user_id,product_id" }
    );

    if (error) {
      toast.error("Failed to add to cart");
    } else {
      toast.success(`${productName} added to cart`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">My Wishlist</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        My Wishlist ({wishlistProducts.length})
      </h2>

      {wishlistProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Your wishlist is empty</p>
          <p className="text-sm mb-4">Save items you love for later</p>
          <Link to="/products">
            <Button>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistProducts.map((product: any) => {
            const discount =
              product.original_price && product.original_price > product.price
                ? Math.round(
                    ((product.original_price - product.price) /
                      product.original_price) *
                      100
                  )
                : 0;

            return (
              <div
                key={product.id}
                className="border border-border rounded-lg overflow-hidden bg-secondary/20 hover:shadow-md transition-shadow"
              >
                <Link to={`/product/${product.id}`}>
                  <div className="relative aspect-square bg-secondary/30">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
                        -{discount}%
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">
                    {product.brand}
                  </p>
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-primary">
                      Rs.{Number(product.price).toLocaleString()}
                    </span>
                    {product.original_price &&
                      product.original_price > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          Rs.{Number(product.original_price).toLocaleString()}
                        </span>
                      )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(product.id, product.name)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleWishlist(product.id)}
                      disabled={isToggling}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistTab;
