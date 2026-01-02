import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, TrendingUp, Clock } from "lucide-react";
import { HighlightText } from "@/lib/highlight-text";
import { cn } from "@/lib/utils";

interface SearchAutocompleteProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  isMobile?: boolean;
}

const SearchAutocomplete = ({
  className = "",
  inputClassName = "",
  placeholder = "Search for products...",
  isMobile = false,
}: SearchAutocompleteProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ["search-suggestions", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, brand, image_url, price")
        .eq("is_active", true)
        .or(`name.ilike.%${debouncedQuery}%,brand.ilike.%${debouncedQuery}%`)
        .limit(6);
      
      if (error) throw error;
      return data || [];
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Fetch popular/trending products when input is focused but empty
  const { data: popularProducts = [] } = useQuery({
    queryKey: ["popular-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, brand, image_url, price")
        .eq("is_active", true)
        .eq("is_top_seller", true)
        .limit(4);
      
      if (error) throw error;
      return data || [];
    },
  });

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery);
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const handleSuggestionClick = (productSlug: string, productName: string) => {
    saveRecentSearch(productName);
    setIsOpen(false);
    setSearchQuery("");
    navigate(`/product/${productSlug}`);
  };

  const handleRecentClick = (query: string) => {
    setSearchQuery(query);
    saveRecentSearch(query);
    navigate(`/products?search=${encodeURIComponent(query)}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const showDropdown = isOpen && (
    suggestions.length > 0 || 
    (searchQuery.length < 2 && (recentSearches.length > 0 || popularProducts.length > 0))
  );

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSearch}>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            className={cn(
              "pl-4 pr-12 w-full rounded-lg border-2 border-muted focus:border-primary bg-card",
              isMobile ? "h-10" : "h-11",
              inputClassName
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
          <Button 
            type="submit"
            size="icon" 
            aria-label="Search products"
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90",
              isMobile ? "h-8 w-8" : "h-9 w-9"
            )}
          >
            <Search className="h-4 w-4 text-primary-foreground" />
          </Button>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Search Results */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground font-medium px-2 mb-2">Products</p>
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSuggestionClick(product.slug, product.name)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                    <img 
                      src={product.image_url || "/placeholder.svg"} 
                      alt={product.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      <HighlightText text={product.name} highlight={searchQuery} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <HighlightText text={product.brand} highlight={searchQuery} />
                      {" • "}
                      <span className="text-primary font-semibold">
                        Rs.{Number(product.price).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </button>
              ))}
              <Link
                to={`/products?search=${encodeURIComponent(searchQuery)}`}
                onClick={() => { saveRecentSearch(searchQuery); setIsOpen(false); setSearchQuery(""); }}
                className="block text-center text-sm text-primary font-medium py-2 hover:bg-secondary/30 rounded-lg mt-1"
              >
                View all results for "{searchQuery}"
              </Link>
            </div>
          )}

          {/* Recent Searches */}
          {searchQuery.length < 2 && recentSearches.length > 0 && (
            <div className="p-2 border-b border-border">
              <div className="flex items-center justify-between px-2 mb-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </p>
                <button 
                  onClick={clearRecentSearches}
                  className="text-xs text-primary hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentClick(query)}
                    className="px-3 py-1.5 text-xs bg-secondary/50 hover:bg-secondary text-foreground rounded-full transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Products */}
          {searchQuery.length < 2 && popularProducts.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground font-medium px-2 mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Trending Products
              </p>
              {popularProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSuggestionClick(product.id, product.name)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                    <img 
                      src={product.image_url || "/placeholder.svg"} 
                      alt={product.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.brand}
                      {" • "}
                      <span className="text-primary font-semibold">
                        Rs.{Number(product.price).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
