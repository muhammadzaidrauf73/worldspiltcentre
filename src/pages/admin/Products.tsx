import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import ImageUpload from "@/components/admin/ImageUpload";
import GalleryUpload from "@/components/admin/GalleryUpload";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Upload, Download, Search, Filter, Percent, Tag, BadgePercent, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  brand: string;
  price: string;
  original_price: string;
  cost_price: string;
  category_id: string;
  image_url: string;
  gallery_images: string[];
  stock_quantity: string;
  is_featured: boolean;
  is_active: boolean;
  is_new_arrival: boolean;
  is_top_seller: boolean;
  is_on_sale: boolean;
  colors: string[];
}

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  price: "",
  original_price: "",
  cost_price: "",
  category_id: "",
  image_url: "",
  gallery_images: [],
  stock_quantity: "0",
  is_featured: false,
  is_active: true,
  is_new_arrival: false,
  is_top_seller: false,
  is_on_sale: false,
  colors: [],
};

const PRESET_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Silver", value: "#C0C0C0" },
  { name: "Gray", value: "#808080" },
  { name: "Red", value: "#EF4444" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Gold", value: "#EAB308" },
  { name: "Rose Gold", value: "#E8B4B8" },
  { name: "Navy", value: "#1E3A5F" },
  { name: "Brown", value: "#8B4513" },
  { name: "Beige", value: "#F5F5DC" },
];

const AdminProducts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [bulkPriceDialogOpen, setBulkPriceDialogOpen] = useState(false);
  const [priceUpdatePercent, setPriceUpdatePercent] = useState<number>(0);
  const [priceUpdateCategory, setPriceUpdateCategory] = useState<string>("selected");
  const [priceUpdateMode, setPriceUpdateMode] = useState<"adjust" | "discount">("adjust");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [bulkMarginDialogOpen, setBulkMarginDialogOpen] = useState(false);
  const [bulkMarginPercent, setBulkMarginPercent] = useState<number>(20);
  const [bulkCsvData, setBulkCsvData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const productData = {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, "-"),
        description: data.description,
        brand: data.brand,
        price: parseFloat(data.price),
        original_price: data.original_price ? parseFloat(data.original_price) : null,
        cost_price: data.cost_price ? parseFloat(data.cost_price) : 0,
        category_id: data.category_id || null,
        image_url: data.image_url,
        gallery_images: data.gallery_images,
        stock_quantity: parseInt(data.stock_quantity),
        is_featured: data.is_featured,
        is_active: data.is_active,
        is_new_arrival: data.is_new_arrival,
        is_top_seller: data.is_top_seller,
        is_on_sale: data.is_on_sale,
        colors: data.colors,
      };

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(editingId ? "Product updated" : "Product created");
      setIsOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (error) => {
      toast.error("Error saving product: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
    },
    onError: (error) => {
      toast.error("Error deleting product: " + error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(`${selectedProducts.length} products deleted`);
      setSelectedProducts([]);
    },
    onError: (error) => {
      toast.error("Error deleting products: " + error.message);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("products")
        .update(updates as any)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(`${selectedProducts.length} products updated`);
      setSelectedProducts([]);
    },
    onError: (error) => {
      toast.error("Error updating products: " + error.message);
    },
  });

  const deleteByCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("category_id", categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("All products in category deleted");
      setCategoryFilter("all");
    },
    onError: (error) => {
      toast.error("Error deleting products: " + error.message);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const allIds = products.map((p: any) => p.id);
      // Delete in batches of 100
      for (let i = 0; i < allIds.length; i += 100) {
        const batch = allIds.slice(i, i + 100);
        const { error } = await supabase.from("products").delete().in("id", batch);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("All products deleted successfully");
      setSelectedProducts([]);
    },
    onError: (error) => {
      toast.error("Error deleting all products: " + error.message);
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (productsData: any[]) => {
      const { error } = await supabase.from("products").insert(productsData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Products uploaded successfully");
      setIsBulkUploadOpen(false);
      setBulkCsvData("");
    },
    onError: (error) => {
      toast.error("Error uploading products: " + error.message);
    },
  });

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      brand: product.brand,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      cost_price: product.cost_price?.toString() || "",
      category_id: product.category_id || "",
      image_url: product.image_url || "",
      gallery_images: product.gallery_images || [],
      stock_quantity: product.stock_quantity?.toString() || "0",
      is_featured: product.is_featured,
      is_active: product.is_active,
      is_new_arrival: product.is_new_arrival || false,
      is_top_seller: product.is_top_seller || false,
      is_on_sale: product.is_on_sale || false,
      colors: product.colors || [],
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map((p: any) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error("No products selected");
      return;
    }

    switch (action) {
      case "delete":
        if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
          bulkDeleteMutation.mutate(selectedProducts);
        }
        break;
      case "activate":
        bulkUpdateMutation.mutate({ ids: selectedProducts, updates: { is_active: true } });
        break;
      case "deactivate":
        bulkUpdateMutation.mutate({ ids: selectedProducts, updates: { is_active: false } });
        break;
      case "feature":
        bulkUpdateMutation.mutate({ ids: selectedProducts, updates: { is_featured: true } });
        break;
      case "unfeature":
        bulkUpdateMutation.mutate({ ids: selectedProducts, updates: { is_featured: false } });
        break;
      case "new-arrival":
        bulkUpdateMutation.mutate({ ids: selectedProducts, updates: { is_new_arrival: true } });
        break;
      case "top-seller":
        bulkUpdateMutation.mutate({ ids: selectedProducts, updates: { is_top_seller: true } });
        break;
      case "add-sale":
        bulkUpdateMutation.mutate({ ids: selectedProducts, updates: { is_on_sale: true } });
        break;
      case "remove-sale":
        bulkUpdateMutation.mutate({ ids: selectedProducts, updates: { is_on_sale: false } });
        break;
      case "change-category":
        setBulkCategoryDialogOpen(true);
        break;
      case "remove-category":
        bulkUpdateMutation.mutate({ ids: selectedProducts, updates: { category_id: null } });
        break;
      case "update-prices":
        setBulkPriceDialogOpen(true);
        break;
      case "set-margin":
        setBulkMarginDialogOpen(true);
        break;
    }
  };

  const handleBulkCategoryChange = (categoryId: string) => {
    if (selectedProducts.length === 0) return;
    bulkUpdateMutation.mutate({ 
      ids: selectedProducts, 
      updates: { category_id: categoryId || null } 
    });
    setBulkCategoryDialogOpen(false);
  };

  const handleBulkSetMargin = async () => {
    if (selectedProducts.length === 0) return;
    if (bulkMarginPercent < 0 || bulkMarginPercent >= 100) {
      toast.error("Margin must be between 0 and 99");
      return;
    }
    try {
      const targets = products.filter((p: any) => selectedProducts.includes(p.id));
      await Promise.all(
        targets.map((p: any) => {
          const price = Number(p.price) || 0;
          const cost = +(price * (1 - bulkMarginPercent / 100)).toFixed(2);
          return supabase.from("products").update({ cost_price: cost } as any).eq("id", p.id);
        })
      );
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(`Cost set on ${targets.length} products at ${bulkMarginPercent}% margin`);
      setBulkMarginDialogOpen(false);
      setSelectedProducts([]);
    } catch (e: any) {
      toast.error("Failed to set margin: " + (e?.message || "unknown"));
    }
  };

  const handleBulkPriceUpdate = async () => {
    // Validation based on mode
    if (priceUpdateMode === "adjust" && priceUpdatePercent === 0) {
      toast.error("Please enter a percentage value");
      return;
    }
    if (priceUpdateMode === "discount" && discountPercent === 0) {
      toast.error("Please enter a discount percentage");
      return;
    }

    let productsToUpdate: any[] = [];
    
    if (priceUpdateCategory === "selected") {
      if (selectedProducts.length === 0) {
        toast.error("No products selected");
        return;
      }
      productsToUpdate = products.filter((p: any) => selectedProducts.includes(p.id));
    } else if (priceUpdateCategory === "all") {
      productsToUpdate = products;
    } else {
      // Category ID
      productsToUpdate = products.filter((p: any) => p.category_id === priceUpdateCategory);
    }

    if (productsToUpdate.length === 0) {
      toast.error("No products found to update");
      return;
    }

    try {
      for (const product of productsToUpdate) {
        let updates: Record<string, any> = {};
        
        if (priceUpdateMode === "adjust") {
          // Adjust prices by percentage (increase/decrease)
          const multiplier = 1 + (priceUpdatePercent / 100);
          updates.price = Math.round(product.price * multiplier);
          if (product.original_price) {
            updates.original_price = Math.round(product.original_price * multiplier);
          }
        } else {
          // Set discount mode: set original_price and calculate discounted price
          const basePrice = product.original_price || product.price;
          const discountedPrice = Math.round(basePrice * (1 - discountPercent / 100));
          updates.original_price = basePrice;
          updates.price = discountedPrice;
          updates.discount_percentage = discountPercent;
        }
        
        await supabase
          .from("products")
          .update(updates as any)
          .eq("id", product.id);
      }
      
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      
      if (priceUpdateMode === "adjust") {
        toast.success(`Updated prices for ${productsToUpdate.length} products by ${priceUpdatePercent > 0 ? '+' : ''}${priceUpdatePercent}%`);
      } else {
        toast.success(`Applied ${discountPercent}% discount to ${productsToUpdate.length} products`);
      }
      
      setBulkPriceDialogOpen(false);
      setPriceUpdatePercent(0);
      setDiscountPercent(0);
      setPriceUpdateCategory("selected");
      setPriceUpdateMode("adjust");
    } catch (error: any) {
      toast.error("Error updating prices: " + error.message);
    }
  };

  // Parse CSV line handling quoted values with commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleBulkUpload = () => {
    try {
      const firstLine = (bulkCsvData || "").trim().split(/\r?\n/).find((l) => l.trim()) || "";
      if (/^https?:\/\//i.test(firstLine) && !firstLine.includes(",")) {
        toast("This box is for CSV. Opening URL importer...");
        setIsBulkUploadOpen(false);
        navigate(`/admin/product-import?url=${encodeURIComponent(firstLine)}`);
        return;
      }

      const lines = bulkCsvData.trim().split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        toast.error("Invalid CSV data. Please include header row and at least one product.");
        return;
      }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/^["']|["']$/g, ''));
      const productsToUpload = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const product: any = {
          is_active: true,
          stock_quantity: 0,
        };

        headers.forEach((header, index) => {
          // Remove surrounding quotes from value
          const rawValue = values[index] || "";
          const value = rawValue.replace(/^["']|["']$/g, '');
          
          switch (header) {
            case "name":
              product.name = value;
              product.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, '');
              break;
            case "brand":
              product.brand = value;
              break;
            case "price":
              product.price = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
              break;
            case "original_price":
              product.original_price = value ? parseFloat(value.replace(/[^0-9.]/g, '')) : null;
              break;
            case "description":
              product.description = value;
              break;
            case "image_url":
              product.image_url = value;
              break;
            case "stock":
            case "stock_quantity":
              product.stock_quantity = parseInt(value.replace(/[^0-9]/g, '')) || 0;
              break;
            case "category":
              const cat = categories.find((c) => c.name.toLowerCase() === value.toLowerCase());
              if (cat) product.category_id = cat.id;
              break;
          }
        });

        if (product.name && product.brand && product.price) {
          productsToUpload.push(product);
        }
      }

      if (productsToUpload.length === 0) {
        toast.error("No valid products found in CSV. Required fields: name, brand, price");
        return;
      }

      bulkUploadMutation.mutate(productsToUpload);
    } catch (error) {
      console.error("CSV parse error:", error);
      toast.error("Error parsing CSV data");
    }
  };

  const exportToCSV = () => {
    const headers = ["name", "brand", "price", "original_price", "description", "stock_quantity", "category", "image_url"];
    const csvContent = [
      headers.join(","),
      ...products.map((p: any) =>
        [
          `"${p.name}"`,
          `"${p.brand}"`,
          p.price,
          p.original_price || "",
          `"${p.description || ""}"`,
          p.stock_quantity,
          `"${p.categories?.name || ""}"`,
          `"${p.image_url || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Products exported to CSV");
  };

  const isDeleting = deleteMutation.isPending || bulkDeleteMutation.isPending || deleteByCategoryMutation.isPending || deleteAllMutation.isPending;

  return (
    <AdminLayout>
      {/* Deleting overlay */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-lg">
            <Loader2 className="h-10 w-10 animate-spin text-destructive" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Deleting Products...</h3>
              <p className="text-sm text-muted-foreground mt-1">Please wait while products are being removed.</p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">
              Manage your product catalog ({products.length} products)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {products.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ALL ${products.length} products? This cannot be undone.`)) {
                    deleteAllMutation.mutate();
                  }
                }}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All ({products.length})
              </Button>
            )}
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Products</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>CSV Data</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Paste CSV data with headers: name, brand, price, original_price, description, image_url, stock_quantity, category.
                      <span className="block">Tip: If you have a website URL, paste it and click Upload to open the URL importer.</span>
                    </p>
                    <Textarea
                      value={bulkCsvData}
                      onChange={(e) => setBulkCsvData(e.target.value)}
                      placeholder={`name,brand,price,original_price,description,image_url,stock_quantity,category
Samsung Galaxy S24,Samsung,189999,219999,Latest flagship phone,https://...,50,Smartphones
LG OLED TV 55",LG,299999,349999,4K OLED display,https://...,20,LED TVs`}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkUpload}
                      disabled={bulkUploadMutation.isPending || !bulkCsvData.trim()}
                    >
                      {bulkUploadMutation.isPending ? "Uploading..." : "Upload Products"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog
              open={isOpen}
              onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                  setEditingId(null);
                  setForm(emptyForm);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="brand">Brand *</Label>
                      <Input
                        id="brand"
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        required
                      />
                    </div>
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Sale Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="original_price">Original Price</Label>
                      <Input
                        id="original_price"
                        type="number"
                        value={form.original_price}
                        onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost_price" className="flex items-center gap-1">
                        Cost Price
                        <span className="text-xs text-muted-foreground">(profit calc)</span>
                      </Label>
                      <Input
                        id="cost_price"
                        type="number"
                        placeholder="0"
                        value={form.cost_price}
                        onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                      />
                      {(() => {
                        const price = parseFloat(form.price) || 0;
                        const cost = parseFloat(form.cost_price) || 0;
                        if (price <= 0 || cost <= 0) return null;
                        const profit = price - cost;
                        const margin = (profit / price) * 100;
                        return (
                          <p className={`text-xs ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                            Profit: Rs.{profit.toLocaleString()} • Margin: {margin.toFixed(1)}%
                          </p>
                        );
                      })()}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={form.stock_quantity}
                        onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={form.category_id}
                      onValueChange={(value) => setForm({ ...form, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Main Product Image</Label>
                    <ImageUpload
                      value={form.image_url}
                      onChange={(url) => setForm({ ...form, image_url: url })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gallery Images (up to 8 images)</Label>
                    <GalleryUpload
                      value={form.gallery_images}
                      onChange={(urls) => setForm({ ...form, gallery_images: urls })}
                      maxImages={8}
                    />
                  </div>

                  {/* Product Colors */}
                  <div className="space-y-2">
                    <Label>Product Colors</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select available colors for this product
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => {
                        const isSelected = form.colors.includes(color.value);
                        return (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setForm({
                                  ...form,
                                  colors: form.colors.filter((c) => c !== color.value),
                                });
                              } else {
                                setForm({
                                  ...form,
                                  colors: [...form.colors, color.value],
                                });
                              }
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full border border-border shadow-sm"
                              style={{ backgroundColor: color.value }}
                            />
                            <span className="text-sm">{color.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    {form.colors.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Selected:</span>
                        <div className="flex gap-1">
                          {form.colors.map((color) => (
                            <span
                              key={color}
                              className="w-6 h-6 rounded-full border-2 border-primary shadow-sm"
                              style={{ backgroundColor: color }}
                              title={PRESET_COLORS.find((c) => c.value === color)?.name || color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_featured"
                        checked={form.is_featured}
                        onCheckedChange={(checked) => setForm({ ...form, is_featured: checked })}
                      />
                      <Label htmlFor="is_featured">Featured</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_active"
                        checked={form.is_active}
                        onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_new_arrival"
                        checked={form.is_new_arrival}
                        onCheckedChange={(checked) => setForm({ ...form, is_new_arrival: checked })}
                      />
                      <Label htmlFor="is_new_arrival">New Arrival</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_top_seller"
                        checked={form.is_top_seller}
                        onCheckedChange={(checked) => setForm({ ...form, is_top_seller: checked })}
                      />
                      <Label htmlFor="is_top_seller">Top Seller</Label>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Switch
                        id="is_on_sale"
                        checked={form.is_on_sale}
                        onCheckedChange={(checked) => setForm({ ...form, is_on_sale: checked })}
                      />
                      <Label htmlFor="is_on_sale" className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-destructive rounded-full">
                          <span className="text-destructive-foreground text-[6px] font-bold">SALE</span>
                        </span>
                        Sale Badge
                      </Label>
                    </div>
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

        {/* Search, Filter, and Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryFilter !== "all" && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPriceUpdateCategory(categoryFilter);
                    setPriceUpdateMode("adjust");
                    setBulkPriceDialogOpen(true);
                  }}
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Update Prices
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPriceUpdateCategory(categoryFilter);
                    setPriceUpdateMode("discount");
                    setBulkPriceDialogOpen(true);
                  }}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Set Discount
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    const categoryName = categories.find(c => c.id === categoryFilter)?.name;
                    const categoryProducts = products.filter((p: any) => p.category_id === categoryFilter);
                    if (categoryProducts.length === 0) {
                      toast.error("No products in this category");
                      return;
                    }
                    if (confirm(`Add SALE badge to all ${categoryProducts.length} products in "${categoryName}"?`)) {
                      try {
                        await supabase
                          .from("products")
                          .update({ is_on_sale: true })
                          .eq("category_id", categoryFilter);
                        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
                        toast.success(`Added SALE badge to ${categoryProducts.length} products`);
                      } catch (error: any) {
                        toast.error("Error: " + error.message);
                      }
                    }
                  }}
                >
                  <BadgePercent className="h-4 w-4 mr-2" />
                  Add Sale Badge
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const categoryName = categories.find(c => c.id === categoryFilter)?.name;
                    const categoryProducts = products.filter((p: any) => p.category_id === categoryFilter && p.is_on_sale);
                    if (categoryProducts.length === 0) {
                      toast.error("No products with SALE badge in this category");
                      return;
                    }
                    if (confirm(`Remove SALE badge from ${categoryProducts.length} products in "${categoryName}"?`)) {
                      try {
                        await supabase
                          .from("products")
                          .update({ is_on_sale: false })
                          .eq("category_id", categoryFilter);
                        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
                        toast.success(`Removed SALE badge from products`);
                      } catch (error: any) {
                        toast.error("Error: " + error.message);
                      }
                    }
                  }}
                >
                  Remove Sale
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const categoryName = categories.find(c => c.id === categoryFilter)?.name;
                    if (confirm(`Delete ALL products in "${categoryName}"? This cannot be undone.`)) {
                      deleteByCategoryMutation.mutate(categoryFilter);
                    }
                  }}
                  disabled={deleteByCategoryMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </div>
            )}
          </div>

          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedProducts.length} selected
              </span>
              <Select onValueChange={handleBulkAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Bulk Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Activate</SelectItem>
                  <SelectItem value="deactivate">Deactivate</SelectItem>
                  <SelectItem value="feature">Mark as Featured</SelectItem>
                  <SelectItem value="unfeature">Remove Featured</SelectItem>
                  <SelectItem value="new-arrival">Mark as New Arrival</SelectItem>
                  <SelectItem value="top-seller">Mark as Top Seller</SelectItem>
                  <SelectItem value="add-sale">Add Sale Badge</SelectItem>
                  <SelectItem value="remove-sale">Remove Sale Badge</SelectItem>
                  <SelectItem value="change-category">Change Category</SelectItem>
                  <SelectItem value="remove-category">Remove Category</SelectItem>
                  <SelectItem value="update-prices">Update Prices (%)</SelectItem>
                  <SelectItem value="set-margin">Set Cost from Margin %</SelectItem>
                  <SelectItem value="delete">Delete Selected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProducts([])}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Bulk Margin Dialog */}
        <Dialog open={bulkMarginDialogOpen} onOpenChange={setBulkMarginDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Cost from Profit Margin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Apply a profit margin % to {selectedProducts.length} selected products.
                Cost price will be set to: <strong>price × (1 − margin%)</strong>.
              </p>
              <div className="space-y-2">
                <Label>Profit Margin (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={99}
                  value={bulkMarginPercent}
                  onChange={(e) => setBulkMarginPercent(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Example: price Rs.10,000 at 20% → cost Rs.8,000, profit Rs.2,000
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setBulkMarginDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleBulkSetMargin}>Apply Margin</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Category Change Dialog */}
        <Dialog open={bulkCategoryDialogOpen} onOpenChange={setBulkCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Category for {selectedProducts.length} Products</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a new category to assign to all selected products.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleBulkCategoryChange(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setBulkCategoryDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Price Update Dialog */}
        <Dialog open={bulkPriceDialogOpen} onOpenChange={(open) => {
          setBulkPriceDialogOpen(open);
          if (!open) {
            setPriceUpdatePercent(0);
            setDiscountPercent(0);
            setPriceUpdateCategory("selected");
            setPriceUpdateMode("adjust");
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {priceUpdateMode === "adjust" ? (
                  <Percent className="h-5 w-5" />
                ) : (
                  <Tag className="h-5 w-5" />
                )}
                {priceUpdateMode === "adjust" ? "Bulk Price Update" : "Set Category Discount"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={priceUpdateMode === "adjust" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPriceUpdateMode("adjust")}
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Adjust Prices
                </Button>
                <Button
                  variant={priceUpdateMode === "discount" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPriceUpdateMode("discount")}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Set Discount
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                {priceUpdateMode === "adjust" 
                  ? "Increase or decrease prices by a percentage for selected products or an entire category."
                  : "Set a discount percentage on products. This will set the original price and calculate the sale price."}
              </p>
              
              <div className="space-y-2">
                <Label>Apply to</Label>
                <Select value={priceUpdateCategory} onValueChange={setPriceUpdateCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="selected">
                      Selected Products ({selectedProducts.length})
                    </SelectItem>
                    <SelectItem value="all">All Products ({products.length})</SelectItem>
                    {categories.map((cat) => {
                      const count = products.filter((p: any) => p.category_id === cat.id).length;
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} ({count})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {priceUpdateMode === "adjust" ? (
                <div className="space-y-2">
                  <Label>Price Change (%)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={priceUpdatePercent}
                      onChange={(e) => setPriceUpdatePercent(Number(e.target.value))}
                      placeholder="0"
                      min={-90}
                      max={500}
                      className="w-32"
                    />
                    <span className="text-sm font-medium">
                      {priceUpdatePercent > 0 
                        ? `+${priceUpdatePercent}% (increase)` 
                        : priceUpdatePercent < 0 
                          ? `${priceUpdatePercent}% (decrease)` 
                          : 'No change'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use positive values to increase, negative to decrease prices
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Discount Percentage</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      placeholder="0"
                      min={0}
                      max={90}
                      className="w-32"
                    />
                    <span className="text-sm font-medium text-green-600">
                      {discountPercent > 0 ? `${discountPercent}% OFF` : 'No discount'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Original price will be preserved, sale price will be calculated
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setBulkPriceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkPriceUpdate} 
                  disabled={priceUpdateMode === "adjust" ? priceUpdatePercent === 0 : discountPercent === 0}
                >
                  {priceUpdateMode === "adjust" ? "Update Prices" : "Apply Discount"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredProducts.length > 0 &&
                      selectedProducts.length === filteredProducts.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost / Margin</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) =>
                          handleSelectProduct(product.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.categories?.name || "-"}</TableCell>
                    <TableCell>Rs.{Number(product.price).toLocaleString()}</TableCell>
                    <TableCell>
                      {(() => {
                        const price = Number(product.price) || 0;
                        const cost = Number(product.cost_price) || 0;
                        if (cost <= 0) return <span className="text-xs text-muted-foreground">—</span>;
                        const profit = price - cost;
                        const margin = price > 0 ? (profit / price) * 100 : 0;
                        return (
                          <div className="text-xs leading-tight">
                            <div>Rs.{cost.toLocaleString()}</div>
                            <div className={profit >= 0 ? "text-green-600" : "text-red-500"}>
                              {margin.toFixed(1)}%
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.is_active
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {product.is_featured && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">
                            Featured
                          </span>
                        )}
                        {product.is_new_arrival && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-500">
                            New
                          </span>
                        )}
                        {product.is_top_seller && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500">
                            Top
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Delete this product?")) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
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
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
