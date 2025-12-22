import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, SlidersHorizontal, X, Truck } from "lucide-react";
import SEO from "@/components/SEO";

const PRODUCTS_PER_PAGE = 24;

const Products = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");
  const dealsParam = searchParams.get("deals");
  const searchParam = searchParams.get("search");
  
  const [searchQuery, setSearchQuery] = useState(searchParam || "");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [isPriceFiltered, setIsPriceFiltered] = useState(false);
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const showDealsOnly = dealsParam === "true";
  
  // Update search query when URL param changes
  useEffect(() => {
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
  }, [searchParam]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    await queryClient.invalidateQueries({ queryKey: ["brands"] });
  };

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch active flash deals for filtering
  const { data: flashDeals = [] } = useQuery({
    queryKey: ["flash-deals-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flash_deals")
        .select("product_id, deal_price, original_price")
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString());
      if (error) throw error;
      return data;
    },
    enabled: showDealsOnly,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", selectedCategory, selectedBrands, sortBy, searchQuery, categories, priceRange, isPriceFiltered, freeDeliveryOnly, showDealsOnly, flashDeals],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("is_active", true);
      
      // Filter by flash deal product IDs if showing deals only
      if (showDealsOnly && flashDeals.length > 0) {
        const dealProductIds = flashDeals.map(d => d.product_id).filter(Boolean);
        if (dealProductIds.length > 0) {
          query = query.in("id", dealProductIds);
        }
      }
      
      if (selectedCategory) {
        const category = categories.find(c => c.slug === selectedCategory || c.name === selectedCategory);
        if (category) {
          query = query.eq("category_id", category.id);
        }
      }
      
      if (selectedBrands.length > 0) {
        query = query.in("brand", selectedBrands);
      }
      
      if (isPriceFiltered && (priceRange[0] > 0 || priceRange[1] < 1000000)) {
        query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);
      }

      if (freeDeliveryOnly) {
        query = query.eq("is_free_delivery", true);
      }
      
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = searchQuery.trim();
        query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      switch (sortBy) {
        case "price-low":
          query = query.order("price", { ascending: true });
          break;
        case "price-high":
          query = query.order("price", { ascending: false });
          break;
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: (categories.length > 0 || !selectedCategory) && (!showDealsOnly || flashDeals.length > 0 || !showDealsOnly),
  });

  // Get price range from products
  const productPriceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 1000000 };
    const prices = products.map(p => Number(p.price));
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [products]);

  const toggleBrand = (brandName: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandName) 
        ? prev.filter(b => b !== brandName)
        : [...prev, brandName]
    );
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value as [number, number]);
    setIsPriceFiltered(true);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrands([]);
    setSearchQuery("");
    setSortBy("newest");
    setPriceRange([0, 1000000]);
    setIsPriceFiltered(false);
    setFreeDeliveryOnly(false);
    setFiltersOpen(false);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [selectedCategory, selectedBrands, searchQuery, sortBy, priceRange, isPriceFiltered, freeDeliveryOnly]);

  // Visible products (paginated)
  const visibleProducts = useMemo(() => {
    return products.slice(0, visibleCount);
  }, [products, visibleCount]);

  const hasMoreProducts = visibleCount < products.length;

  const loadMoreProducts = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + PRODUCTS_PER_PAGE, products.length));
  }, [products.length]);

  const activeFiltersCount = [
    selectedCategory, 
    selectedBrands.length > 0 ? "brands" : "", 
    searchQuery,
    isPriceFiltered ? "price" : "",
    freeDeliveryOnly ? "delivery" : ""
  ].filter(Boolean).length;

  const hasFilters = selectedCategory || selectedBrands.length > 0 || searchQuery || isPriceFiltered || freeDeliveryOnly;

  const categoryName = showDealsOnly 
    ? "Flash Deals" 
    : selectedCategory 
      ? categories.find(c => c.slug === selectedCategory)?.name || "Products"
      : "All Products";

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('PKR', '₨');
  };

  // Price Filter Component
  const PriceFilter = () => (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Price</h3>
      <div className="px-1">
        <Slider
          value={priceRange}
          onValueChange={handlePriceChange}
          min={0}
          max={1000000}
          step={5000}
          className="mb-4"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Price: {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}</span>
        </div>
      </div>
    </div>
  );

  // Free Delivery Filter Component
  const FreeDeliveryFilter = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="mb-6">
      <div 
        className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors p-2 rounded-lg border border-border hover:border-primary/50"
        onClick={() => {
          setFreeDeliveryOnly(!freeDeliveryOnly);
          onSelect?.();
        }}
      >
        <Checkbox 
          checked={freeDeliveryOnly}
          onCheckedChange={() => setFreeDeliveryOnly(!freeDeliveryOnly)}
          className="h-4 w-4"
        />
        <Truck className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-foreground">
          Free Delivery Only
        </span>
      </div>
    </div>
  );

  // Get brand product counts
  const brandProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(product => {
      if (product.brand) {
        counts[product.brand] = (counts[product.brand] || 0) + 1;
      }
    });
    return counts;
  }, [products]);


  // Brand Filter Component with Checkboxes
  const BrandFilter = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Brand</h3>
      <ScrollArea className="h-56">
        <div className="space-y-1 pr-3">
          {brands.map((brand: any) => {
            const count = brandProductCounts[brand.name] || 0;
            return (
              <div 
                key={brand.id} 
                className={`flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors rounded-md px-2 py-1.5 ${
                  selectedBrands.includes(brand.name) ? "bg-primary/10" : ""
                }`}
                onClick={() => {
                  toggleBrand(brand.name);
                  onSelect?.();
                }}
              >
                <Checkbox 
                  checked={selectedBrands.includes(brand.name)}
                  onCheckedChange={() => toggleBrand(brand.name)}
                  className="h-4 w-4"
                />
                <span className={`text-sm flex-1 truncate ${
                  selectedBrands.includes(brand.name) ? "text-primary font-medium" : "text-muted-foreground"
                }`}>
                  {brand.name}
                </span>
                {count > 0 && (
                  <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  // Category Filter Component
  const CategoryFilter = ({ onSelect }: { onSelect?: () => void }) => {
    // Calculate total products from categories
    const totalProducts = categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0);
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Categories</h3>
        <ScrollArea className="h-52">
          <div className="space-y-1 pr-3">
            <button
              onClick={() => { 
                setSelectedCategory(""); 
                onSelect?.();
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center justify-between ${
                !selectedCategory 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              <span>All Categories</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                !selectedCategory ? "bg-primary-foreground/20" : "bg-secondary"
              }`}>
                {totalProducts}
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { 
                  setSelectedCategory(cat.slug); 
                  onSelect?.();
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center justify-between ${
                  selectedCategory === cat.slug 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "hover:bg-secondary text-muted-foreground"
                }`}
              >
                <span className="truncate pr-2">{cat.name}</span>
                {(cat.product_count || 0) > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                    selectedCategory === cat.slug ? "bg-primary-foreground/20" : "bg-secondary"
                  }`}>
                    {cat.product_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">
        <SEO 
          title={`${categoryName} - Shop Electronics`}
          description={`Browse our collection of ${categoryName.toLowerCase()}. Best prices on air conditioners, LED TVs, refrigerators, washing machines and home appliances in Lahore.`}
          keywords={`${categoryName.toLowerCase()}, electronics lahore, buy ${categoryName.toLowerCase()} pakistan, world spilt centre`}
        />
        <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Mobile Filter Button */}
          <div className="md:hidden">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </span>
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-primary hover:underline font-normal"
                      >
                        Clear all
                      </button>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-full mt-4 pb-8">
                  <div className="space-y-4 pr-4">
                    {/* Search */}
                    <div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* Price Filter */}
                    <PriceFilter />

                    {/* Categories */}
                    <CategoryFilter onSelect={() => setFiltersOpen(false)} />

                    {/* Free Delivery Filter */}
                    <FreeDeliveryFilter onSelect={() => setFiltersOpen(false)} />

                    {/* Brands */}
                    {brands.length > 0 && <BrandFilter onSelect={() => setFiltersOpen(false)} />}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-card rounded-lg border border-border p-5 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground text-lg">Filters</h2>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Price Filter */}
              <PriceFilter />

              {/* Categories */}
              <CategoryFilter />

              {/* Free Delivery Filter */}
              <FreeDeliveryFilter />

              {/* Brands */}
              {brands.length > 0 && <BrandFilter />}
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-xl font-heading font-bold text-foreground">
                  {selectedCategory 
                    ? categories.find(c => c.slug === selectedCategory)?.name || "Products"
                    : "All Products"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {products.length} products found
                </p>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-card text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Active Filters */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {categories.find(c => c.slug === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedBrands.map(brand => (
                  <span key={brand} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {brand}
                    <button onClick={() => toggleBrand(brand)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {isPriceFiltered && (priceRange[0] > 0 || priceRange[1] < 1000000) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    <button onClick={() => { setPriceRange([0, 1000000]); setIsPriceFiltered(false); }}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {freeDeliveryOnly && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                    <Truck className="h-3 w-3" />
                    Free Delivery
                    <button onClick={() => setFreeDeliveryOnly(false)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {isLoading ? (
              <ProductGridSkeleton count={9} />
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">No products found</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {visibleProducts.map((product, index) => {
                    // Find deal price if this is a flash deal product
                    const dealInfo = showDealsOnly 
                      ? flashDeals.find(d => d.product_id === product.id)
                      : null;
                    
                    return (
                      <Link key={product.id} to={`/product/${product.id}`}>
                        <ProductCard
                          id={product.id}
                          name={product.name}
                          brand={product.brand}
                          price={dealInfo ? Number(dealInfo.deal_price) : Number(product.price)}
                          originalPrice={dealInfo ? Number(dealInfo.original_price) : (product.original_price ? Number(product.original_price) : undefined)}
                          image={product.image_url || ""}
                          rating={Number(product.rating) || 0}
                          reviews={product.reviews_count || 0}
                          isOnSale={product.is_on_sale || false}
                          isFreeDelivery={product.is_free_delivery || false}
                          badge={showDealsOnly ? "⚡ Flash Deal" : undefined}
                          index={index}
                          searchHighlight={searchQuery}
                        />
                      </Link>
                    );
                  })}
                </div>
                
                {/* Load More Button */}
                {hasMoreProducts && (
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={loadMoreProducts}
                      variant="outline"
                      size="lg"
                      className="px-8"
                    >
                      Load More ({products.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      
        <Footer />
      </div>
    </PullToRefresh>
  );
};

export default Products;