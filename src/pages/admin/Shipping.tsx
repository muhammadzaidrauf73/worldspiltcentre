import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";

interface ShippingOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  estimated_days: string | null;
  free_shipping_threshold: number | null;
}

const AdminShipping = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<ShippingOption | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    is_active: true,
    estimated_days: "",
    free_shipping_threshold: "",
  });

  const { data: shippingOptions, isLoading } = useQuery({
    queryKey: ["admin-shipping"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_settings")
        .select("*")
        .order("price", { ascending: true });
      if (error) throw error;
      return data as ShippingOption[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("shipping_settings").insert([{
        ...data,
        free_shipping_threshold: data.free_shipping_threshold || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
      toast.success("Shipping option created");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Failed to create: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("shipping_settings")
        .update({
          ...data,
          free_shipping_threshold: data.free_shipping_threshold || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
      toast.success("Shipping option updated");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shipping_settings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
      toast.success("Shipping option deleted");
    },
    onError: (error: any) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      is_active: true,
      estimated_days: "",
      free_shipping_threshold: "",
    });
    setEditingOption(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (option: ShippingOption) => {
    setEditingOption(option);
    setFormData({
      name: option.name,
      description: option.description || "",
      price: option.price,
      is_active: option.is_active,
      estimated_days: option.estimated_days || "",
      free_shipping_threshold: option.free_shipping_threshold?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      is_active: formData.is_active,
      estimated_days: formData.estimated_days || null,
      free_shipping_threshold: formData.free_shipping_threshold ? Number(formData.free_shipping_threshold) : null,
    };
    
    if (editingOption) {
      updateMutation.mutate({ id: editingOption.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Shipping Settings</h1>
            <p className="text-muted-foreground">Manage shipping options and pricing</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Shipping Option
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingOption ? "Edit Shipping Option" : "Add Shipping Option"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Standard Delivery"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Delivery within 5-7 days"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (Rs.) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_days">Estimated Days</Label>
                    <Input
                      id="estimated_days"
                      value={formData.estimated_days}
                      onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                      placeholder="e.g., 3-5 days"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="free_shipping_threshold">Free Shipping Threshold (Rs.)</Label>
                  <Input
                    id="free_shipping_threshold"
                    type="number"
                    value={formData.free_shipping_threshold}
                    onChange={(e) => setFormData({ ...formData, free_shipping_threshold: e.target.value })}
                    placeholder="Leave empty for no free shipping"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Orders above this amount get free shipping for this option
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingOption ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : shippingOptions && shippingOptions.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Est. Days</TableHead>
                  <TableHead>Free Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingOptions.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell className="font-medium">{option.name}</TableCell>
                    <TableCell className="text-muted-foreground">{option.description || "-"}</TableCell>
                    <TableCell>Rs.{Number(option.price).toLocaleString()}</TableCell>
                    <TableCell>{option.estimated_days || "-"}</TableCell>
                    <TableCell>
                      {option.free_shipping_threshold 
                        ? `Rs.${Number(option.free_shipping_threshold).toLocaleString()}` 
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        option.is_active 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {option.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(option)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this shipping option?")) {
                              deleteMutation.mutate(option.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No shipping options</h3>
            <p className="text-muted-foreground mb-4">Create your first shipping option</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Shipping Option
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminShipping;
