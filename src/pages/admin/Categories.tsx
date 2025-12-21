import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import ImageUpload from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Package, Search, Minus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  icon: string;
  image_url: string;
  display_order: string;
}

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  image_url: "",
  display_order: "0",
};

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [productStocks, setProductStocks] = useState<Record<string, string>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [bulkStockDialogOpen, setBulkStockDialogOpen] = useState(false);
  const [bulkStockQuantity, setBulkStockQuantity] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-");
      const normalizedName = data.name.trim().toLowerCase();
      
      // Check for duplicate name or slug (excluding current category if editing)
      let duplicateQuery = supabase
        .from("categories")
        .select("id, name, slug")
        .or(`name.ilike.${normalizedName},slug.eq.${slug}`);
      
      if (editingId) {
        duplicateQuery = duplicateQuery.neq("id", editingId);
      }
      
      const { data: existingCategories, error: checkError } = await duplicateQuery;
      
      if (checkError) throw checkError;
      
      if (existingCategories && existingCategories.length > 0) {
        const duplicate = existingCategories[0];
        if (duplicate.name.toLowerCase() === normalizedName) {
          throw new Error(`A category with the name "${duplicate.name}" already exists`);
        }
        if (duplicate.slug === slug) {
          throw new Error(`A category with the slug "${slug}" already exists`);
        }
      }

      const categoryData = {
        name: data.name.trim(),
        slug: slug,
        description: data.description,
        icon: data.icon,
        image_url: data.image_url,
        display_order: parseInt(data.display_order) || 0,
      };

      if (editingId) {
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(categoryData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(editingId ? "Category updated" : "Category created");
      setIsOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: (error) => {
      toast.error("Error deleting category: " + error.message);
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async (updates: { id: string; stock_quantity: number }[]) => {
      // Update each product individually
      for (const update of updates) {
        const { error } = await supabase
          .from("products")
          .update({ stock_quantity: update.stock_quantity })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Stock updated for all products in ${selectedCategory?.name}`);
      setStockDialogOpen(false);
      setSelectedCategory(null);
      setCategoryProducts([]);
      setProductStocks({});
    },
    onError: (error) => {
      toast.error("Error updating stock: " + error.message);
    },
  });

  const handleUpdateStock = () => {
    if (!selectedCategory || categoryProducts.length === 0) return;
    const updates = categoryProducts.map((product) => ({
      id: product.id,
      stock_quantity: parseInt(productStocks[product.id] || "0") || 0,
    }));
    updateStockMutation.mutate(updates);
  };

  const openStockDialog = async (category: any) => {
    setSelectedCategory(category);
    setLoadingProducts(true);
    setStockDialogOpen(true);
    setProductSearchQuery("");
    
    // Fetch products for this category with more details
    const { data, error } = await supabase
      .from("products")
      .select("id, name, stock_quantity, image_url, price, brand")
      .eq("category_id", category.id)
      .order("name");
    
    if (error) {
      toast.error("Error loading products");
      setLoadingProducts(false);
      return;
    }
    
    setCategoryProducts(data || []);
    // Initialize stock values
    const stocks: Record<string, string> = {};
    (data || []).forEach((p: any) => {
      stocks[p.id] = (p.stock_quantity || 0).toString();
    });
    setProductStocks(stocks);
    setLoadingProducts(false);
  };

  // Filter products based on search query
  const filteredProducts = categoryProducts.filter((product) =>
    product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    product.brand?.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const handleProductStockChange = (productId: string, value: string) => {
    setProductStocks((prev) => ({ ...prev, [productId]: value }));
  };

  const adjustStock = (productId: string, adjustment: number) => {
    setProductStocks((prev) => {
      const currentValue = parseInt(prev[productId] || "0") || 0;
      const newValue = Math.max(0, currentValue + adjustment);
      return { ...prev, [productId]: newValue.toString() };
    });
  };

  const setAllStocksToValue = (value: string) => {
    const newStocks: Record<string, string> = {};
    categoryProducts.forEach((p) => {
      newStocks[p.id] = value;
    });
    setProductStocks(newStocks);
  };

  const bulkUpdateStockMutation = useMutation({
    mutationFn: async (quantity: number) => {
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: quantity })
        .gte("id", "00000000-0000-0000-0000-000000000000"); // Update all products
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock updated for all products");
      setBulkStockDialogOpen(false);
      setBulkStockQuantity("");
    },
    onError: (error) => {
      toast.error("Error updating stock: " + error.message);
    },
  });

  const handleBulkUpdateStock = () => {
    if (!bulkStockQuantity) return;
    bulkUpdateStockMutation.mutate(parseInt(bulkStockQuantity) || 0);
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      image_url: category.image_url || "",
      display_order: category.display_order?.toString() || "0",
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground">Manage product categories</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkStockDialogOpen(true)}>
              <Package className="h-4 w-4 mr-2" />
              Update All Stock
            </Button>
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setEditingId(null);
                setForm(emptyForm);
              } else if (!editingId) {
                // Auto-set display_order to next available number for new categories
                const maxOrder = categories.reduce((max: number, cat: any) => 
                  Math.max(max, cat.display_order || 0), 0);
                setForm({ ...emptyForm, display_order: (maxOrder + 1).toString() });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="auto-generated-from-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon Name</Label>
                    <Input
                      id="icon"
                      value={form.icon}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      placeholder="e.g., Tv, AirVent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={form.display_order}
                      onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category Image</Label>
                  <ImageUpload
                    value={form.image_url}
                    onChange={(url) => setForm({ ...form, image_url: url })}
                    folder="categories"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category: any) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <img
                        src={category.image_url || "/placeholder.svg"}
                        alt={category.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                    <TableCell>{category.icon || "-"}</TableCell>
                    <TableCell>{category.product_count || 0}</TableCell>
                    <TableCell>{category.display_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => openStockDialog(category)}
                          title="Update Stock"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Stock Update Dialog - Per Product */}
        <Dialog open={stockDialogOpen} onOpenChange={(open) => {
          setStockDialogOpen(open);
          if (!open) {
            setSelectedCategory(null);
            setCategoryProducts([]);
            setProductStocks({});
            setProductSearchQuery("");
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Update Stock for {selectedCategory?.name}</DialogTitle>
              <DialogDescription>
                Update stock quantity for each product. Total: {categoryProducts.length} products
              </DialogDescription>
            </DialogHeader>
            
            {loadingProducts ? (
              <div className="py-8 text-center text-muted-foreground">Loading products...</div>
            ) : categoryProducts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No products in this category</div>
            ) : (
              <>
                {/* Search and Set All */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pb-3 border-b">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or brand..."
                      className="pl-9"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Set all to:</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Value"
                      className="w-20"
                      onChange={(e) => {
                        if (e.target.value) setAllStocksToValue(e.target.value);
                      }}
                    />
                  </div>
                </div>

                {/* Products List */}
                <div className="flex-1 overflow-y-auto py-2 max-h-[400px]">
                  {filteredProducts.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No products match your search
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredProducts.map((product) => (
                        <div 
                          key={product.id} 
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {/* Product Image */}
                          <img
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            className="h-14 w-14 rounded-md object-cover flex-shrink-0 border border-border"
                          />
                          
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={product.name}>
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{product.brand}</span>
                              <span>•</span>
                              <span>Rs {product.price?.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          {/* Stock Controls */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Quick Adjust Buttons */}
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => handleProductStockChange(product.id, "0")}
                              >
                                0
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => adjustStock(product.id, -10)}
                              >
                                -10
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => adjustStock(product.id, 10)}
                              >
                                +10
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => adjustStock(product.id, 100)}
                              >
                                +100
                              </Button>
                            </div>
                            
                            {/* Stock Input */}
                            <Input
                              type="number"
                              min="0"
                              className="w-20 h-8"
                              value={productStocks[product.id] || "0"}
                              onChange={(e) => handleProductStockChange(product.id, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {productSearchQuery && (
                  <p className="text-xs text-muted-foreground pt-2">
                    Showing {filteredProducts.length} of {categoryProducts.length} products
                  </p>
                )}
              </>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateStock}
                disabled={categoryProducts.length === 0 || updateStockMutation.isPending}
              >
                {updateStockMutation.isPending ? "Saving..." : `Save All (${categoryProducts.length})`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Stock Update Dialog for All Products */}
        <Dialog open={bulkStockDialogOpen} onOpenChange={setBulkStockDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Update Stock for All Products</DialogTitle>
              <DialogDescription>
                Set the stock quantity for ALL products across all categories. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-stock-quantity">Stock Quantity</Label>
                <Input
                  id="bulk-stock-quantity"
                  type="number"
                  min="0"
                  placeholder="Enter stock quantity"
                  value={bulkStockQuantity}
                  onChange={(e) => setBulkStockQuantity(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBulkStockDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkUpdateStock}
                  disabled={!bulkStockQuantity || bulkUpdateStockMutation.isPending}
                >
                  {bulkUpdateStockMutation.isPending ? "Updating..." : "Update All Products"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
