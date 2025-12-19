import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useWishlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("product_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((item) => item.product_id);
    },
    enabled: !!user,
  });

  const addToWishlist = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("wishlist_items")
        .insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Added to wishlist!");
    },
    onError: () => {
      toast.error("Failed to add to wishlist");
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
    onError: () => {
      toast.error("Failed to remove from wishlist");
    },
  });

  const toggleWishlist = (productId: string) => {
    if (!user) {
      toast.error("Please sign in to add items to wishlist");
      return;
    }
    if (wishlistItems.includes(productId)) {
      removeFromWishlist.mutate(productId);
    } else {
      addToWishlist.mutate(productId);
    }
  };

  const isInWishlist = (productId: string) => wishlistItems.includes(productId);

  return {
    wishlistItems,
    isLoading,
    toggleWishlist,
    isInWishlist,
    isToggling: addToWishlist.isPending || removeFromWishlist.isPending,
  };
};
