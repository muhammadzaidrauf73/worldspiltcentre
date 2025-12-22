import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, User, Menu, X, Heart, Phone, ChevronDown, LogOut, Shield, ArrowRight, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useWishlist } from "@/hooks/useWishlist";
import SearchAutocomplete from "@/components/SearchAutocomplete";

import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { wishlistItems } = useWishlist();
  
  const navigate = useNavigate();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Hot Deals", path: "/products?deals=true", highlight: true },
  ];

  // Fetch categories from database
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['navbar-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch featured products for mega menu
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['navbar-featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, original_price, image_url, discount_percentage')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  // Fallback categories if database is empty
  const categories = dbCategories.length > 0 ? dbCategories : [
    { id: '1', name: "Air Conditioner", slug: "air-conditioner", image_url: null },
    { id: '2', name: "LED TV", slug: "led-tv", image_url: null },
    { id: '3', name: "Refrigerator", slug: "refrigerator", image_url: null },
    { id: '4', name: "Washing Machines", slug: "washing-machines", image_url: null },
    { id: '5', name: "Microwave Oven", slug: "microwave-oven", image_url: null },
    { id: '6', name: "Water Dispenser", slug: "water-dispenser", image_url: null },
    { id: '7', name: "Small Electronics", slug: "small-electronics", image_url: null },
  ];

  // Fetch announcement settings
  const { data: settings } = useQuery({
    queryKey: ['announcement-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('key, value')
        .in('key', ['announcement_enabled', 'announcement_message', 'announcement_bg_color', 'announcement_text_color']);
      if (error) throw error;
      return data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string | null>) || {};
    },
  });

  const announcementEnabled = settings?.announcement_enabled === 'true';
  const announcementMessage = settings?.announcement_message || '';
  const announcementBgColor = settings?.announcement_bg_color || '#f97316';
  const announcementTextColor = settings?.announcement_text_color || '#ffffff';

  // Fetch cart count
  const { data: cartCount = 0 } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id);
      if (error) return 0;
      return data.reduce((sum, item) => sum + item.quantity, 0);
    },
    enabled: !!user,
  });


  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Announcement Bar */}
      {announcementEnabled && announcementMessage && (
        <div 
          className="py-2 text-center text-sm font-medium relative overflow-hidden"
          style={{ backgroundColor: announcementBgColor, color: announcementTextColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          <div className="container mx-auto px-4 flex items-center justify-center gap-2 relative">
            <span className="animate-pulse">🔔</span>
            <span>{announcementMessage}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <img 
                  src="/logo.png" 
                  alt="World Spilt Centre" 
                  className="h-11 w-12 object-contain relative"
                  width={48}
                  height={44}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-heading font-bold text-xl text-foreground leading-tight tracking-tight">
                  World <span className="text-primary">Spilt</span> Centre
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">Premium Electronics</p>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <SearchAutocomplete placeholder="Search for products, brands..." />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Phone - Desktop */}
              <a href="tel:0300-4649141" className="hidden lg:flex items-center gap-3 mr-2 group cursor-pointer hover:bg-secondary/50 rounded-xl px-3 py-2 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Call Us</p>
                  <p className="font-semibold text-foreground text-sm">0300-4649141</p>
                </div>
              </a>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {/* User Menu */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hidden sm:flex h-10 w-10 rounded-full hover:bg-secondary">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-2">
                      <DropdownMenuItem asChild className="rounded-lg">
                        <Link to="/account" className="cursor-pointer flex items-center gap-2 py-2">
                          <User className="h-4 w-4" />
                          My Account
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild className="rounded-lg">
                            <Link to="/admin" className="cursor-pointer text-primary flex items-center gap-2 py-2">
                              <Shield className="h-4 w-4" />
                              Admin Panel
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive rounded-lg flex items-center gap-2 py-2">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/auth" aria-label="Login or Register">
                    <Button variant="ghost" size="icon" className="hidden sm:flex h-10 w-10 rounded-full hover:bg-secondary" aria-label="Login or Register">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                
                <Link to="/wishlist">
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-secondary">
                    <Heart className="h-5 w-5" />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-lg">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Button>
                </Link>
                
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-secondary">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-lg">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10 rounded-full"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <div className="mt-4 md:hidden">
            <SearchAutocomplete placeholder="Search products..." isMobile />
          </div>
        </div>

        {/* Categories Bar - Desktop with Mega Menu */}
        <div className="hidden md:block bg-secondary/30 border-t border-border/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center">
              {/* Shop by Categories with Mega Menu */}
              <div 
                className="relative"
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                <Button 
                  className="flex items-center gap-3 h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-semibold text-sm"
                >
                  <Menu className="h-4 w-4" />
                  <span>All Categories</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {/* Mega Menu */}
                {isMegaMenuOpen && (
                  <div className="absolute top-full left-0 w-[820px] bg-background border border-border rounded-b-2xl shadow-2xl z-50 animate-fade-in overflow-hidden">
                    <div className="grid grid-cols-12 gap-0">
                      {/* Categories List */}
                      <div className="col-span-4 bg-secondary/40 p-5 border-r border-border/50">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                          Browse Categories
                        </h3>
                        <div 
                          className="space-y-1 max-h-[340px] overflow-y-auto pr-2"
                          style={{ scrollbarWidth: 'thin' }}
                        >
                          {categories.map((cat) => (
                            <Link
                              key={cat.id}
                              to={`/products?category=${encodeURIComponent(cat.name)}`}
                              className="flex items-center gap-3 px-3 py-3 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all duration-200 group"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              {cat.image_url ? (
                                <img 
                                  src={cat.image_url} 
                                  alt={cat.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-border shadow-sm"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                                  <span className="text-sm font-bold text-primary">{cat.name.charAt(0)}</span>
                                </div>
                              )}
                              <span className="flex-1 font-medium">{cat.name}</span>
                              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-primary" />
                            </Link>
                          ))}
                        </div>
                        <Link
                          to="/products"
                          className="flex items-center gap-2 mt-4 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 rounded-xl transition-all"
                          onClick={() => setIsMegaMenuOpen(false)}
                        >
                          View All Categories
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                      
                      {/* Featured Products */}
                      <div className="col-span-8 p-6">
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground">Featured Products</h3>
                        </div>
                        
                        {featuredProducts.length > 0 ? (
                          <div className="grid grid-cols-3 gap-4">
                            {featuredProducts.map((product) => (
                              <Link
                                key={product.id}
                                to={`/product/${product.id}`}
                                className="group"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="relative bg-secondary/50 rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
                                  {product.discount_percentage && product.discount_percentage > 0 && (
                                    <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                                      -{product.discount_percentage}%
                                    </span>
                                  )}
                                  <div className="aspect-square rounded-xl overflow-hidden bg-background mb-3">
                                    <img 
                                      src={product.image_url || '/placeholder.svg'} 
                                      alt={product.name}
                                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[40px]">
                                    {product.name}
                                  </h4>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-base font-bold text-primary">
                                      {formatPrice(product.price)}
                                    </span>
                                    {product.original_price && product.original_price > product.price && (
                                      <span className="text-xs text-muted-foreground line-through">
                                        {formatPrice(product.original_price)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="bg-secondary/50 rounded-2xl p-4 border border-border/50">
                                <div className="aspect-square rounded-xl bg-muted animate-pulse mb-3" />
                                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Quick Links */}
                        <div className="mt-6 pt-5 border-t border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <Link 
                              to="/products?deals=true" 
                              className="text-sm font-medium text-destructive hover:underline flex items-center gap-2 bg-destructive/10 px-3 py-1.5 rounded-full"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              🔥 Hot Deals
                            </Link>
                            <Link 
                              to="/products?sort=newest" 
                              className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-2"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              ✨ New Arrivals
                            </Link>
                          </div>
                          <Link 
                            to="/products" 
                            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                            onClick={() => setIsMegaMenuOpen(false)}
                          >
                            View All Products <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation Links */}
              <nav className="flex items-center ml-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative px-5 py-4 text-sm font-medium transition-all duration-200 hover:bg-background/50 ${
                      link.highlight 
                        ? "text-primary" 
                        : "text-foreground hover:text-primary"
                    }`}
                  >
                    {link.name}
                    {link.highlight && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
                    )}
                  </Link>
                ))}
                <Link
                  to="/products"
                  className="px-5 py-4 text-sm font-medium text-foreground hover:text-primary hover:bg-background/50 transition-all duration-200"
                >
                  All Products
                </Link>
                {user && (
                  <Link
                    to="/orders"
                    className="px-5 py-4 text-sm font-medium text-foreground hover:text-primary hover:bg-background/50 transition-all duration-200"
                  >
                    Orders
                  </Link>
                )}
                <Link
                  to="/contact"
                  className="px-5 py-4 text-sm font-medium text-foreground hover:text-primary hover:bg-background/50 transition-all duration-200"
                >
                  Contact
                </Link>
              </nav>
              
              {/* Right Side - Login */}
              {!user && (
                <Link
                  to="/auth"
                  className="ml-auto flex items-center gap-2 px-5 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-full transition-all duration-200 border border-primary/20"
                >
                  <User className="h-4 w-4" />
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background animate-fade-in max-h-[75vh] overflow-y-auto">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`py-3.5 px-4 rounded-xl transition-all flex items-center min-h-[48px] ${
                      link.highlight 
                        ? "text-primary font-medium bg-primary/5" 
                        : "text-foreground hover:bg-secondary active:bg-secondary/80"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                    {link.highlight && <span className="ml-2 w-2 h-2 bg-destructive rounded-full animate-pulse" />}
                  </Link>
                ))}
                
                <Link
                  to="/products"
                  className="py-3.5 px-4 text-foreground hover:bg-secondary active:bg-secondary/80 rounded-xl flex items-center min-h-[48px]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  All Products
                </Link>
                
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      className="py-3.5 px-4 text-foreground hover:bg-secondary active:bg-secondary/80 rounded-xl flex items-center gap-3 min-h-[48px]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="py-3.5 px-4 text-foreground hover:bg-secondary active:bg-secondary/80 rounded-xl flex items-center gap-3 min-h-[48px]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </div>
                      Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      className="py-3.5 px-4 text-foreground hover:bg-secondary active:bg-secondary/80 rounded-xl flex items-center gap-3 min-h-[48px]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                      </div>
                      Wishlist
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="py-3.5 px-4 text-primary hover:bg-primary/10 active:bg-primary/20 rounded-xl flex items-center gap-3 min-h-[48px] font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="py-3.5 px-4 text-left text-destructive hover:bg-destructive/10 active:bg-destructive/20 rounded-xl flex items-center gap-3 min-h-[48px] w-full"
                    >
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <LogOut className="h-4 w-4 text-destructive" />
                      </div>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    className="py-3.5 px-4 text-primary font-medium bg-primary/5 hover:bg-primary/10 active:bg-primary/20 rounded-xl flex items-center gap-3 min-h-[48px]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    Login / Register
                  </Link>
                )}
                
                <div className="border-t border-border my-3 pt-4">
                  <p className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Categories</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${encodeURIComponent(cat.name)}`}
                        className="py-3 px-3 text-sm text-foreground hover:bg-secondary active:bg-secondary/80 rounded-xl transition-all flex items-center gap-2.5 min-h-[44px] border border-border/50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-7 h-7 rounded-lg object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{cat.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="truncate text-sm">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Contact Info */}
                <div className="border-t border-border mt-2 pt-4">
                  <a 
                    href="tel:0300-4649141" 
                    className="py-4 px-4 text-foreground bg-primary/5 hover:bg-primary/10 rounded-xl flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Need Help? Call Us</p>
                      <p className="font-bold text-foreground">0300-4649141</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
