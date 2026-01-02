import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products?: {
    id: string;
    slug: string;
    name: string;
    price: number;
    original_price: number | null;
    image_url: string | null;
    brand: string;
    is_free_delivery: boolean;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = "guest_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart on mount and when user changes
  useEffect(() => {
    loadCart();
  }, [user]);

  // Merge guest cart when user logs in
  useEffect(() => {
    if (user) {
      mergeGuestCartToUser();
    }
  }, [user]);

  const loadCart = async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Load from Supabase for authenticated users
        const { data, error } = await supabase
          .from("cart_items")
          .select("*, products(*)")
          .eq("user_id", user.id);
        
        if (error) throw error;
        setCartItems(data || []);
      } else {
        // Load from localStorage for guests
        const guestCart = localStorage.getItem(GUEST_CART_KEY);
        if (guestCart) {
          const parsedCart = JSON.parse(guestCart);
          // Fetch product details for guest cart items
          if (parsedCart.length > 0) {
            const productIds = parsedCart.map((item: any) => item.product_id);
            const { data: products } = await supabase
              .from("products")
              .select("*")
              .in("id", productIds);
            
            const itemsWithProducts = parsedCart.map((item: any) => ({
              ...item,
              products: products?.find(p => p.id === item.product_id),
            }));
            setCartItems(itemsWithProducts);
          } else {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const mergeGuestCartToUser = async () => {
    if (!user) return;
    
    const guestCart = localStorage.getItem(GUEST_CART_KEY);
    if (!guestCart) return;
    
    try {
      const parsedCart = JSON.parse(guestCart);
      if (parsedCart.length === 0) return;
      
      // Merge each guest item to user's cart
      for (const item of parsedCart) {
        await supabase
          .from("cart_items")
          .upsert({
            user_id: user.id,
            product_id: item.product_id,
            quantity: item.quantity,
          }, {
            onConflict: "user_id,product_id",
          });
      }
      
      // Clear guest cart
      localStorage.removeItem(GUEST_CART_KEY);
      
      // Reload cart
      await loadCart();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    } catch (error) {
      console.error("Error merging guest cart:", error);
    }
  };

  const addToCart = async (productId: string, quantity: number) => {
    if (user) {
      // Add to Supabase for authenticated users
      const { error } = await supabase
        .from("cart_items")
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity,
        }, {
          onConflict: "user_id,product_id",
        });
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    } else {
      // Add to localStorage for guests
      const guestCart = localStorage.getItem(GUEST_CART_KEY);
      const cart = guestCart ? JSON.parse(guestCart) : [];
      
      const existingIndex = cart.findIndex((item: any) => item.product_id === productId);
      if (existingIndex >= 0) {
        cart[existingIndex].quantity = quantity;
      } else {
        cart.push({
          id: `guest_${Date.now()}`,
          product_id: productId,
          quantity,
        });
      }
      
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    }
    
    await loadCart();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    } else {
      const guestCart = localStorage.getItem(GUEST_CART_KEY);
      if (guestCart) {
        const cart = JSON.parse(guestCart);
        const itemIndex = cart.findIndex((item: any) => item.id === itemId);
        if (itemIndex >= 0) {
          cart[itemIndex].quantity = quantity;
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
        }
      }
    }
    
    await loadCart();
  };

  const removeFromCart = async (itemId: string) => {
    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    } else {
      const guestCart = localStorage.getItem(GUEST_CART_KEY);
      if (guestCart) {
        const cart = JSON.parse(guestCart);
        const filtered = cart.filter((item: any) => item.id !== itemId);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(filtered));
      }
    }
    
    await loadCart();
  };

  const clearCart = async () => {
    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
    }
    
    setCartItems([]);
  };

  const refreshCart = async () => {
    await loadCart();
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      isLoading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};