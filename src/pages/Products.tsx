import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, SlidersHorizontal, X } from "lucide-react";
import SEO from "@/components/SEO";

const Products = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "");
  const [selectedBrand, setSelectedBrand] = useState(brandParam || "");
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", selectedCategory, selectedBrand, sortBy, searchQuery, categories],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("is_active", true);
      
      if (selectedCategory) {
        const category = categories.find(c => c.slug === selectedCategory || c.name === selectedCategory);
        if (category) {
          query = query.eq("category_id", category.id);
        }
      }
      
      if (selectedBrand) {
        query = query.eq("brand", selectedBrand);
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
    enabled: categories.length > 0 || !selectedCategory,
  });

  // Brands now fetched from database

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSearchQuery("");
    setSortBy("newest");
    setFiltersOpen(false);
  };

  const activeFiltersCount = [selectedCategory, selectedBrand, searchQuery].filter(Boolean).length;

  const hasFilters = selectedCategory || selectedBrand || searchQuery;

  const categoryName = selectedCategory 
    ? categories.find(c => c.slug === selectedCategory)?.name || "Products"
    : "All Products";

  return (
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
              <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
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
                <div className="mt-4 space-y-4">
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

                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Categories</h3>
                    <ScrollArea className="h-32">
                      <div className="space-y-1 pr-3">
                        <button
                          onClick={() => { setSelectedCategory(""); setFiltersOpen(false); }}
                          className={`w-full text-left px-2 py-1.5 rounded text-sm transition-smooth ${
                            !selectedCategory ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                          }`}
                        >
                          All Categories
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => { setSelectedCategory(cat.slug); setFiltersOpen(false); }}
                            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-smooth ${
                              selectedCategory === cat.slug ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Brands */}
                  {brands.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">Brands</h3>
                      <ScrollArea className="h-40">
                        <div className="space-y-1 pr-3">
                          <button
                            onClick={() => { setSelectedBrand(""); setFiltersOpen(false); }}
                            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-smooth ${
                              !selectedBrand ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                            }`}
                          >
                            All Brands
                          </button>
                          {brands.map((brand: any) => (
                            <button
                              key={brand.id}
                              onClick={() => { setSelectedBrand(brand.name); setFiltersOpen(false); }}
                              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-smooth ${
                                selectedBrand === brand.name ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                              }`}
                            >
                              {brand.name}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-card rounded-lg border border-border p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </h2>
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
              <div className="mb-4">
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

              {/* Categories */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-foreground mb-2">Categories</h3>
                <ScrollArea className="h-48">
                  <div className="space-y-1 pr-3">
                    <button
                      onClick={() => setSelectedCategory("")}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm transition-smooth ${
                        !selectedCategory ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-smooth ${
                          selectedCategory === cat.slug ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Brands */}
              {brands.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-foreground mb-2">Brands</h3>
                  <ScrollArea className="h-64">
                    <div className="space-y-1 pr-3">
                      <button
                        onClick={() => setSelectedBrand("")}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-smooth ${
                          !selectedBrand ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                        }`}
                      >
                        All Brands
                      </button>
                      {brands.map((brand: any) => (
                        <button
                          key={brand.id}
                          onClick={() => setSelectedBrand(brand.name)}
                          className={`w-full text-left px-2 py-1.5 rounded text-sm transition-smooth ${
                            selectedBrand === brand.name ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                          }`}
                        >
                          {brand.name}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
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
                {selectedBrand && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {selectedBrand}
                    <button onClick={() => setSelectedBrand("")}>
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product, index) => (
                  <Link key={product.id} to={`/product/${product.id}`}>
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      brand={product.brand}
                      price={Number(product.price)}
                      originalPrice={product.original_price ? Number(product.original_price) : undefined}
                      image={product.image_url || ""}
                      rating={Number(product.rating) || 0}
                      reviews={product.reviews_count || 0}
                      badge={product.discount_percentage ? `${product.discount_percentage}% OFF` : undefined}
                      index={index}
                    />
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Products;
