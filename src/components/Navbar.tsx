import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingCart, User, Menu, X, Heart, Phone, ChevronDown, LogOut, Shield } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Hot Deals", path: "/products?deals=true", highlight: true },
  ];

  const categories = [
    "Air Conditioner",
    "LED TV",
    "Refrigerator",
    "Washing Machines",
    "Microwave Oven",
    "Water Dispenser",
    "Small Electronics",
  ];

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

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Announcement Bar */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">🔔</span>
            <span className="font-medium">MEGA SALE - Up to 50% Off on Electronics!</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="tel:0300-4649141" className="hover:underline flex items-center gap-1">
              <Phone className="h-3 w-3" />
              0300-4649141
            </a>
            <Link to="#" className="hover:underline">About Us</Link>
            <Link to="#" className="hover:underline">Blog</Link>
            <Link to="#contact" className="hover:underline">Contact Us</Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">AC</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-heading font-bold text-lg text-foreground leading-tight">
                  AYAN <span className="text-primary">&</span> CO
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
              <div className="hidden lg:flex items-center gap-2 mr-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Call Us</p>
                  <p className="font-semibold text-foreground text-sm">0300-4649141</p>
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
                    <DropdownMenuItem asChild>
                      <Link to="/account?tab=orders" className="cursor-pointer">
                        Orders
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

        {/* Categories Bar - Desktop */}
        <div className="hidden md:block bg-secondary/50 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1">
              {/* Shop by Categories Dropdown */}
              <div className="relative group">
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 h-11 px-4 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-none"
                >
                  <Menu className="h-4 w-4" />
                  Shop by Categories
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="absolute top-full left-0 bg-card border border-border rounded-b-lg shadow-lg min-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      to={`/products?category=${encodeURIComponent(cat)}`}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-secondary hover:text-primary transition-smooth"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
              
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-3 text-sm font-medium transition-smooth ${
                    link.highlight 
                      ? "text-primary hover:text-primary/80" 
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {!user && (
                <Link
                  to="/auth"
                  className="ml-auto px-4 py-3 text-sm font-medium text-primary hover:text-primary/80"
                >
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
                      key={cat}
                      to={`/products?category=${encodeURIComponent(cat)}`}
                      className="block py-2 px-4 text-foreground hover:bg-secondary rounded-lg transition-smooth"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {cat}
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
