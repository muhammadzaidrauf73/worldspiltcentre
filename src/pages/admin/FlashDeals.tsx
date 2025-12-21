import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Zap, Link2, ListPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ImageUpload from "@/components/admin/ImageUpload";

interface FlashDeal {
  id: string;
  name: string;
  original_price: number;
  deal_price: number;
  image_url: string | null;
  sold_percentage: number;
  is_active: boolean;
  ends_at: string;
  display_order: number;
  product_id: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
}

const AdminFlashDeals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<FlashDeal | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkFormData, setBulkFormData] = useState({
    discount_percentage: "10",
    ends_at: "",
    is_active: true,
  });
  const [formData, setFormData] = useState({
    name: "",
    original_price: "",
    deal_price: "",
    image_url: "",
    sold_percentage: "0",
    is_active: true,
    ends_at: "",
    display_order: "0",
    product_id: "",
  });

  const { data: deals, isLoading, error } = useQuery({
    queryKey: ["flash-deals"],
    queryFn: async () => {
      console.log("Fetching flash deals...");
      const { data, error } = await supabase
        .from("flash_deals")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching flash deals:", error);
        throw error;
      }
      console.log("Flash deals fetched:", data);
      return data as FlashDeal[];
    },
  });

  // Log for debugging
  console.log("Flash deals state:", { deals, isLoading, error });

  const { data: products } = useQuery({
    queryKey: ["products-for-deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, original_price, image_url")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<FlashDeal, "id">) => {
      const { error } = await supabase.from("flash_deals").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flash-deals"] });
      toast({ title: "Flash deal created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating flash deal", description: error.message, variant: "destructive" });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (deals: Omit<FlashDeal, "id">[]) => {
      const { error } = await supabase.from("flash_deals").insert(deals);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flash-deals"] });
      toast({ title: `${selectedProducts.length} flash deals created successfully` });
      resetBulkForm();
    },
    onError: (error) => {
      toast({ title: "Error creating flash deals", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FlashDeal> & { id: string }) => {
      const { error } = await supabase
        .from("flash_deals")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flash-deals"] });
      toast({ title: "Flash deal updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating flash deal", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("flash_deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flash-deals"] });
      toast({ title: "Flash deal deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting flash deal", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      original_price: "",
      deal_price: "",
      image_url: "",
      sold_percentage: "0",
      is_active: true,
      ends_at: "",
      display_order: "0",
      product_id: "",
    });
    setEditingDeal(null);
    setIsDialogOpen(false);
  };

  const resetBulkForm = () => {
    setSelectedProducts([]);
    setBulkFormData({
      discount_percentage: "10",
      ends_at: "",
      is_active: true,
    });
    setIsBulkDialogOpen(false);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      toast({ title: "Please select at least one product", variant: "destructive" });
      return;
    }

    const discountPercent = parseFloat(bulkFormData.discount_percentage) / 100;
    
    const deals = selectedProducts.map((productId, index) => {
      const product = products?.find((p) => p.id === productId);
      if (!product) return null;
      
      const originalPrice = product.original_price || product.price;
      const dealPrice = Math.round(originalPrice * (1 - discountPercent));
      
      return {
        name: product.name,
        original_price: originalPrice,
        deal_price: dealPrice,
        image_url: product.image_url || null,
        sold_percentage: 0,
        is_active: bulkFormData.is_active,
        ends_at: bulkFormData.ends_at,
        display_order: index,
        product_id: productId,
      };
    }).filter(Boolean) as Omit<FlashDeal, "id">[];

    bulkCreateMutation.mutate(deals);
  };

  const handleEdit = (deal: FlashDeal) => {
    setEditingDeal(deal);
    setFormData({
      name: deal.name,
      original_price: deal.original_price.toString(),
      deal_price: deal.deal_price.toString(),
      image_url: deal.image_url || "",
      sold_percentage: deal.sold_percentage.toString(),
      is_active: deal.is_active,
      ends_at: deal.ends_at ? new Date(deal.ends_at).toISOString().slice(0, 16) : "",
      display_order: deal.display_order.toString(),
      product_id: deal.product_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleProductSelect = (productId: string) => {
    if (productId === "none") {
      setFormData({ ...formData, product_id: "" });
      return;
    }
    const product = products?.find((p) => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        product_id: productId,
        name: product.name,
        original_price: (product.original_price || product.price).toString(),
        deal_price: product.price.toString(),
        image_url: product.image_url || "",
      });
    } else {
      setFormData({ ...formData, product_id: "" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      original_price: parseFloat(formData.original_price),
      deal_price: parseFloat(formData.deal_price),
      image_url: formData.image_url || null,
      sold_percentage: parseInt(formData.sold_percentage),
      is_active: formData.is_active,
      ends_at: formData.ends_at,
      display_order: parseInt(formData.display_order),
      product_id: formData.product_id || null,
    };

    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleActive = async (deal: FlashDeal) => {
    updateMutation.mutate({ id: deal.id, is_active: !deal.is_active });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-deal/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-deal" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Flash Deals</h1>
              <p className="text-muted-foreground">Manage limited time offers</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isBulkDialogOpen} onOpenChange={(open) => {
              setIsBulkDialogOpen(open);
              if (!open) resetBulkForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ListPlus className="h-4 w-4" />
                  Bulk Add Deals
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Add Flash Deals</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBulkSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bulk_discount">Discount Percentage *</Label>
                      <Input
                        id="bulk_discount"
                        type="number"
                        min="1"
                        max="99"
                        value={bulkFormData.discount_percentage}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, discount_percentage: e.target.value })}
                        placeholder="10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bulk_ends_at">Ends At *</Label>
                      <Input
                        id="bulk_ends_at"
                        type="datetime-local"
                        value={bulkFormData.ends_at}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, ends_at: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="bulk_is_active"
                      checked={bulkFormData.is_active}
                      onCheckedChange={(checked) => setBulkFormData({ ...bulkFormData, is_active: checked })}
                    />
                    <Label htmlFor="bulk_is_active">Active</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Products ({selectedProducts.length} selected)</Label>
                    <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                      {products?.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Rs.{(product.original_price || product.price).toLocaleString()}
                              {bulkFormData.discount_percentage && (
                                <span className="text-deal ml-2">
                                  → Rs.{Math.round((product.original_price || product.price) * (1 - parseFloat(bulkFormData.discount_percentage || "0") / 100)).toLocaleString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={resetBulkForm}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={bulkCreateMutation.isPending || selectedProducts.length === 0}
                    >
                      {bulkCreateMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Create {selectedProducts.length} Deal{selectedProducts.length !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Flash Deal
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingDeal ? "Edit Flash Deal" : "Add New Flash Deal"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Link to Product (Optional)</Label>
                  <Select
                    value={formData.product_id || "none"}
                    onValueChange={handleProductSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product or create custom deal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Custom Deal (No Link)</SelectItem>
                      {products?.filter(p => p.id).map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - Rs.{product.price.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.product_id && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      Linked to product - details auto-filled
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Samsung 55&quot; 4K Smart TV"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="original_price">Original Price (Rs.) *</Label>
                    <Input
                      id="original_price"
                      type="number"
                      value={formData.original_price}
                      onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                      placeholder="159999"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deal_price">Deal Price (Rs.) *</Label>
                    <Input
                      id="deal_price"
                      type="number"
                      value={formData.deal_price}
                      onChange={(e) => setFormData({ ...formData, deal_price: e.target.value })}
                      placeholder="99999"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    bucket="product-images"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sold_percentage">Sold Percentage (%)</Label>
                    <Input
                      id="sold_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.sold_percentage}
                      onChange={(e) => setFormData({ ...formData, sold_percentage: e.target.value })}
                      placeholder="75"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ends_at">Ends At *</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingDeal ? "Update" : "Create"} Deal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Original Price</TableHead>
                <TableHead>Deal Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Sold %</TableHead>
                <TableHead>Ends At</TableHead>
                <TableHead>Linked</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No flash deals yet. Add your first deal!
                  </TableCell>
                </TableRow>
              ) : (
                deals?.map((deal) => {
                  const discount = Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100);
                  return (
                    <TableRow key={deal.id}>
                      <TableCell>
                        {deal.image_url ? (
                          <img
                            src={deal.image_url}
                            alt={deal.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center">
                            <Zap className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{deal.name}</TableCell>
                      <TableCell>Rs.{deal.original_price.toLocaleString()}</TableCell>
                      <TableCell className="text-deal font-semibold">Rs.{deal.deal_price.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="bg-deal/10 text-deal px-2 py-1 rounded text-sm font-medium">
                          -{discount}%
                        </span>
                      </TableCell>
                      <TableCell>{deal.sold_percentage}%</TableCell>
                      <TableCell className="text-sm">
                        {new Date(deal.ends_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {deal.product_id ? (
                          <Link2 className="h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={deal.is_active}
                          onCheckedChange={() => toggleActive(deal)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(deal)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(deal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFlashDeals;