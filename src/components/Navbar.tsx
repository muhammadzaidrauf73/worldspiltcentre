import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingCart, User, Menu, X, Heart, Phone, ChevronDown, LogOut, Shield, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

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
          className="py-2 text-center text-sm font-medium"
          style={{ backgroundColor: announcementBgColor, color: announcementTextColor }}
        >
          <div className="container mx-auto px-4 flex items-center justify-center gap-2">
            <span className="animate-pulse">🔔</span>
            <span>{announcementMessage}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img 
                src="/logo.png" 
                alt="World Spilt Centre" 
                className="h-10 w-auto object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="font-heading font-bold text-lg text-foreground leading-tight">
                  World <span className="text-primary">Spilt</span> Centre
                </h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Electronics</p>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
              <div className="relative w-full">
                <Input
                  type="search"
                  placeholder="Search for products..."
                  className="pl-4 pr-12 h-11 w-full rounded-lg border-2 border-muted focus:border-primary bg-card"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  type="submit"
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-primary hover:bg-primary/90"
                >
                  <Search className="h-4 w-4 text-primary-foreground" />
                </Button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-3">
              {/* Phone - Desktop */}
              <div className="hidden lg:flex items-center gap-3 mr-2 group cursor-pointer">
                <div className="icon-btn icon-btn-ring">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Call Us</p>
                  <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">0300-4649141</p>
                </div>
              </div>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden sm:flex">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer text-primary">
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="icon" className="hidden sm:flex">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              
              <Button variant="ghost" size="icon" className="hidden sm:flex relative">
                <Heart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-primary text-primary-foreground text-[10px]">
                  0
                </Badge>
              </Button>
              
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-primary text-primary-foreground text-[10px]">
                    {cartCount}
                  </Badge>
                </Button>
              </Link>
              
              <div className="hidden lg:flex items-center">
                <div className="text-right ml-1">
                  <p className="text-xs text-muted-foreground">Cart</p>
                  <p className="font-semibold text-foreground text-sm">
                    {cartCount} items
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <form onSubmit={handleSearch} className="mt-3 md:hidden">
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-4 pr-12 h-10 w-full rounded-lg border-2 border-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit"
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary hover:bg-primary/90"
              >
                <Search className="h-4 w-4 text-primary-foreground" />
              </Button>
            </div>
          </form>
        </div>

        {/* Categories Bar - Desktop with Mega Menu */}
        <div className="hidden md:block bg-card border-t border-border shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center">
              {/* Shop by Categories with Mega Menu */}
              <div 
                className="relative"
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                <Button 
                  className="flex items-center gap-3 h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-semibold text-sm shadow-md"
                >
                  <Menu className="h-5 w-5" />
                  <span>Shop by Categories</span>
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {/* Mega Menu */}
                {isMegaMenuOpen && (
                  <div className="absolute top-full left-0 w-[800px] bg-card border border-border rounded-b-xl shadow-2xl z-50 animate-fade-in">
                    <div className="grid grid-cols-12 gap-0">
                      {/* Categories List */}
                      <div className="col-span-4 bg-secondary/30 p-4 border-r border-border">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                          All Categories
                        </h3>
                        <div 
                          className="space-y-1 max-h-[320px] overflow-y-auto pr-2"
                          style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--primary)) hsl(var(--secondary))' }}
                        >
                          {categories.map((cat) => (
                            <Link
                              key={cat.id}
                              to={`/products?category=${encodeURIComponent(cat.name)}`}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-200 group"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              {cat.image_url ? (
                                <img 
                                  src={cat.image_url} 
                                  alt={cat.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-border shadow-sm"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                                  <span className="text-xs font-bold text-primary">{cat.name.charAt(0)}</span>
                                </div>
                              )}
                              <span className="flex-1">{cat.name}</span>
                              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-primary" />
                            </Link>
                          ))}
                        </div>
                        <Link
                          to="/products"
                          className="flex items-center gap-2 mt-4 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg transition-all"
                          onClick={() => setIsMegaMenuOpen(false)}
                        >
                          Browse All Categories
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                      
                      {/* Featured Products */}
                      <div className="col-span-8 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-bold text-foreground">Featured Products</h3>
                        </div>
                        
                        {featuredProducts.length > 0 ? (
                          <div className="grid grid-cols-3 gap-4">
                            {featuredProducts.map((product) => (
                              <Link
                                key={product.id}
                                to={`/products/${product.slug}`}
                                className="group"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="relative bg-secondary/30 rounded-xl p-3 border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-lg">
                                  {product.discount_percentage && product.discount_percentage > 0 && (
                                    <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                                      -{product.discount_percentage}%
                                    </span>
                                  )}
                                  <div className="aspect-square rounded-lg overflow-hidden bg-background mb-3">
                                    <img 
                                      src={product.image_url || '/placeholder.svg'} 
                                      alt={product.name}
                                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                    {product.name}
                                  </h4>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-sm font-bold text-primary">
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
                              <div key={i} className="bg-secondary/30 rounded-xl p-3 border border-border">
                                <div className="aspect-square rounded-lg bg-muted animate-pulse mb-3" />
                                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Quick Links */}
                        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <Link 
                              to="/products?deals=true" 
                              className="text-sm font-medium text-destructive hover:underline flex items-center gap-1"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              🔥 Hot Deals
                            </Link>
                            <Link 
                              to="/products?sort=newest" 
                              className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-1"
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
              <nav className="flex items-center ml-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative px-5 py-4 text-sm font-medium transition-all duration-200 hover:bg-secondary/50 ${
                      link.highlight 
                        ? "text-primary" 
                        : "text-foreground hover:text-primary"
                    }`}
                  >
                    {link.name}
                    {link.highlight && (
                      <span className="absolute top-2 right-1 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse"></span>
                    )}
                  </Link>
                ))}
                <Link
                  to="/products"
                  className="px-5 py-4 text-sm font-medium text-foreground hover:text-primary hover:bg-secondary/50 transition-all duration-200"
                >
                  All Products
                </Link>
                {user && (
                  <Link
                    to="/account?tab=orders"
                    className="px-5 py-4 text-sm font-medium text-foreground hover:text-primary hover:bg-secondary/50 transition-all duration-200"
                  >
                    Orders
                  </Link>
                )}
                <Link
                  to="/contact"
                  className="px-5 py-4 text-sm font-medium text-foreground hover:text-primary hover:bg-secondary/50 transition-all duration-200"
                >
                  Contact
                </Link>
              </nav>
              
              {/* Right Side - Login */}
              {!user && (
                <Link
                  to="/auth"
                  className="ml-auto flex items-center gap-2 px-5 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-full transition-all duration-200"
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
          <div className="md:hidden border-t border-border bg-card animate-fade-in">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`py-2.5 px-4 rounded-lg transition-smooth ${
                      link.highlight 
                        ? "text-primary font-medium" 
                        : "text-foreground hover:bg-secondary"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                
                {user ? (
                  <>
                    <Link
                      to="/account"
                      className="py-2.5 px-4 text-foreground hover:bg-secondary rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      to="/account?tab=orders"
                      className="py-2.5 px-4 text-foreground hover:bg-secondary rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="py-2.5 px-4 text-left text-destructive hover:bg-secondary rounded-lg"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    className="py-2.5 px-4 text-primary font-medium hover:bg-secondary rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login / Register
                  </Link>
                )}
                
                <div className="border-t border-border my-2 pt-2">
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Categories</p>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      className="block py-2 px-4 text-foreground hover:bg-secondary rounded-lg transition-smooth"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
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
