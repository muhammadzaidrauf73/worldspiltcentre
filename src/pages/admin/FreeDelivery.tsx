import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image_url: string | null;
  is_free_delivery: boolean | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

const AdminFreeDelivery = () => {
  const queryClient = useQueryClient();
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Bulk selection state - optimized for performance
  const [bulkCategoryFilter, setBulkCategoryFilter] = useState<string>("all");
  const [bulkSelectAllActive, setBulkSelectAllActive] = useState(false);
  const [bulkSelectAllFilter, setBulkSelectAllFilter] = useState<string>("all");
  const [bulkSelectAllExcluded, setBulkSelectAllExcluded] = useState<Set<string>>(new Set());
  const [bulkSelectedProducts, setBulkSelectedProducts] = useState<string[]>([]);
  const [bulkSearchQuery, setBulkSearchQuery] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products-delivery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, price, image_url, is_free_delivery, category_id")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  // Products with free delivery
  const freeDeliveryProducts = useMemo(() => 
    products.filter((p) => p.is_free_delivery === true), 
    [products]
  );

  // Filtered free delivery products for display
  const filteredFreeDeliveryProducts = useMemo(() => {
    return freeDeliveryProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [freeDeliveryProducts, searchQuery, categoryFilter]);

  // Products without free delivery for bulk add
  const availableProducts = useMemo(() => 
    products.filter((p) => p.is_free_delivery !== true), 
    [products]
  );

  // Filtered products for bulk dialog
  const filteredBulkProducts = useMemo(() => {
    return availableProducts.filter((product) => {
      const matchesCategory = bulkCategoryFilter === "all" || product.category_id === bulkCategoryFilter;
      const matchesSearch = bulkSearchQuery === "" || 
        product.name.toLowerCase().includes(bulkSearchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(bulkSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [availableProducts, bulkCategoryFilter, bulkSearchQuery]);

  const filteredProductIdsSet = useMemo(() => 
    new Set(filteredBulkProducts.map(p => p.id)), 
    [filteredBulkProducts]
  );

  const bulkExcludedSet = useMemo(() => bulkSelectAllExcluded, [bulkSelectAllExcluded]);

  // Check if we're in select-all mode for the current filter
  const isSelectAllForCurrentFilter = useMemo(() => {
    return bulkSelectAllActive && bulkSelectAllFilter === bulkCategoryFilter;
  }, [bulkSelectAllActive, bulkSelectAllFilter, bulkCategoryFilter]);

  // Calculate selected count efficiently
  const bulkSelectedLabel = useMemo(() => {
    if (isSelectAllForCurrentFilter) {
      const count = filteredBulkProducts.length - bulkExcludedSet.size;
      return `${count} selected`;
    }
    return `${bulkSelectedProducts.length} selected`;
  }, [isSelectAllForCurrentFilter, filteredBulkProducts.length, bulkExcludedSet.size, bulkSelectedProducts.length]);

  const toggleProductSelection = useCallback((productId: string) => {
    if (isSelectAllForCurrentFilter) {
      // In select-all mode, toggle exclusion
      setBulkSelectAllExcluded(prev => {
        const newSet = new Set(prev);
        if (newSet.has(productId)) {
          newSet.delete(productId);
        } else {
          newSet.add(productId);
        }
        return newSet;
      });
    } else {
      // Normal selection mode
      setBulkSelectedProducts(prev => {
        if (prev.includes(productId)) {
          return prev.filter(id => id !== productId);
        }
        return [...prev, productId];
      });
    }
  }, [isSelectAllForCurrentFilter]);

  const selectAllFiltered = useCallback(() => {
    // Switch to select-all mode for current filter
    setBulkSelectAllActive(true);
    setBulkSelectAllFilter(bulkCategoryFilter);
    setBulkSelectAllExcluded(new Set());
    setBulkSelectedProducts([]);
  }, [bulkCategoryFilter]);

  const deselectAllFiltered = useCallback(() => {
    if (isSelectAllForCurrentFilter) {
      // Exit select-all mode
      setBulkSelectAllActive(false);
      setBulkSelectAllFilter("all");
      setBulkSelectAllExcluded(new Set());
    } else {
      // Clear manual selections
      setBulkSelectedProducts([]);
    }
  }, [isSelectAllForCurrentFilter]);

  const isProductSelected = useCallback((productId: string) => {
    if (isSelectAllForCurrentFilter && filteredProductIdsSet.has(productId)) {
      return !bulkExcludedSet.has(productId);
    }
    return bulkSelectedProducts.includes(productId);
  }, [isSelectAllForCurrentFilter, filteredProductIdsSet, bulkExcludedSet, bulkSelectedProducts]);

  const updateMutation = useMutation({
    mutationFn: async ({ ids, isFreeDelivery }: { ids: string[]; isFreeDelivery: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_free_delivery: isFreeDelivery })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids, isFreeDelivery }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products-delivery"] });
      toast.success(`${ids.length} products ${isFreeDelivery ? "marked for" : "removed from"} free delivery`);
    },
    onError: (error) => {
      toast.error("Error updating products: " + error.message);
    },
  });

  const handleRemoveFreeDelivery = (productId: string) => {
    updateMutation.mutate({ ids: [productId], isFreeDelivery: false });
  };

  const handleBulkAdd = () => {
    let selectedIds: string[] = [];
    
    if (isSelectAllForCurrentFilter) {
      // Get all filtered products minus excluded ones
      selectedIds = filteredBulkProducts
        .filter(p => !bulkExcludedSet.has(p.id))
        .map(p => p.id);
    } else {
      selectedIds = bulkSelectedProducts;
    }

    if (selectedIds.length === 0) {
      toast.error("No products selected");
      return;
    }

    updateMutation.mutate(
      { ids: selectedIds, isFreeDelivery: true },
      {
        onSuccess: () => {
          setBulkDialogOpen(false);
          resetBulkSelection();
        },
      }
    );
  };

  const resetBulkSelection = () => {
    setBulkSelectedProducts([]);
    setBulkSelectAllActive(false);
    setBulkSelectAllFilter("all");
    setBulkSelectAllExcluded(new Set());
    setBulkCategoryFilter("all");
    setBulkSearchQuery("");
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const getCategoryProductCount = (categoryId: string) => {
    return availableProducts.filter(p => p.category_id === categoryId).length;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Truck className="h-8 w-8" />
              Free Delivery Products
            </h1>
            <p className="text-muted-foreground">
              Manage which products get free delivery
            </p>
          </div>
          <Dialog open={bulkDialogOpen} onOpenChange={(open) => {
            setBulkDialogOpen(open);
            if (!open) resetBulkSelection();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Products
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add Free Delivery to Products</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Select value={bulkCategoryFilter} onValueChange={setBulkCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories ({availableProducts.length})</SelectItem>
                        {categories.map((category) => {
                          const count = getCategoryProductCount(category.id);
                          return (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name} ({count})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={bulkSearchQuery}
                      onChange={(e) => setBulkSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Selection controls */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAllFiltered}
                      disabled={filteredBulkProducts.length === 0}
                    >
                      Select All ({filteredBulkProducts.length})
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={deselectAllFiltered}
                    >
                      Deselect All
                    </Button>
                  </div>
                  <Badge variant="secondary">{bulkSelectedLabel}</Badge>
                </div>

                {/* Product list */}
                <ScrollArea className="h-[400px] border rounded-lg">
                  {filteredBulkProducts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      {availableProducts.length === 0 
                        ? "All products already have free delivery"
                        : "No products match the filter"}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredBulkProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <Checkbox
                            checked={isProductSelected(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <img
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.brand} • Rs. {product.price.toLocaleString()}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded border border-border shrink-0">
                            {getCategoryName(product.category_id)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkAdd} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Adding..." : "Add Free Delivery"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters for main list */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products with free delivery */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredFreeDeliveryProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {freeDeliveryProducts.length === 0 
                      ? "No products with free delivery. Click 'Add Products' to get started."
                      : "No products match the filter."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFreeDeliveryProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryName(product.category_id)}</Badge>
                    </TableCell>
                    <TableCell>Rs. {product.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFreeDelivery(product.id)}
                        disabled={updateMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredFreeDeliveryProducts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredFreeDeliveryProducts.length} of {freeDeliveryProducts.length} products with free delivery
          </p>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFreeDelivery;
