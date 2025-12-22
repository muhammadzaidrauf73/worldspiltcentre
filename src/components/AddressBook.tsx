import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Edit2, Trash2, Star, Loader2 } from "lucide-react";

interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface AddressFormData {
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

const emptyFormData: AddressFormData = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  is_default: false,
};

const AddressBook = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyFormData);

  // Fetch addresses
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!user,
  });

  // Add/Update address mutation
  const addressMutation = useMutation({
    mutationFn: async (data: AddressFormData & { id?: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      // If setting as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      if (data.id) {
        // Update
        const { error } = await supabase
          .from("addresses")
          .update({
            label: data.label,
            full_name: data.full_name,
            phone: data.phone || null,
            address_line1: data.address_line1,
            address_line2: data.address_line2 || null,
            city: data.city,
            state: data.state || null,
            postal_code: data.postal_code || null,
            is_default: data.is_default,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("addresses")
          .insert({
            user_id: user.id,
            label: data.label,
            full_name: data.full_name,
            phone: data.phone || null,
            address_line1: data.address_line1,
            address_line2: data.address_line2 || null,
            city: data.city,
            state: data.state || null,
            postal_code: data.postal_code || null,
            is_default: data.is_default || addresses.length === 0,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({
        title: editingAddress ? "Address updated" : "Address added",
        description: `Your address has been ${editingAddress ? "updated" : "saved"} successfully.`,
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save address. Please try again.",
      });
    },
  });

  // Delete address mutation
  const deleteMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({
        title: "Address deleted",
        description: "The address has been removed.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete address. Please try again.",
      });
    },
  });

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        label: address.label,
        full_name: address.full_name,
        phone: address.phone || "",
        address_line1: address.address_line1,
        address_line2: address.address_line2 || "",
        city: address.city,
        state: address.state || "",
        postal_code: address.postal_code || "",
        is_default: address.is_default,
      });
    } else {
      setEditingAddress(null);
      setFormData(emptyFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAddress(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.address_line1.trim() || !formData.city.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields.",
      });
      return;
    }
    addressMutation.mutate({
      ...formData,
      id: editingAddress?.id,
    });
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;
    
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
    
    await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", addressId);
    
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
    toast({
      title: "Default address updated",
      description: "This address is now your default delivery address.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Address Book</h2>
            <p className="text-sm text-muted-foreground">Manage your delivery addresses</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No addresses saved yet</p>
          <p className="text-sm">Add your first delivery address</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative p-4 rounded-lg border ${
                address.is_default
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/30"
              }`}
            >
              {address.is_default && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-primary font-medium">
                  <Star className="h-3 w-3 fill-primary" />
                  Default
                </div>
              )}
              <div className="pr-16">
                <p className="font-medium text-foreground">{address.label}</p>
                <p className="text-sm text-foreground mt-1">{address.full_name}</p>
                {address.phone && (
                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {address.address_line1}
                  {address.address_line2 && `, ${address.address_line2}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.city}
                  {address.state && `, ${address.state}`}
                  {address.postal_code && ` ${address.postal_code}`}
                </p>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(address)}
                  className="h-8"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                    className="h-8"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Set Default
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(address.id)}
                  disabled={deleteMutation.isPending}
                  className="h-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="Home, Office, etc."
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="Recipient name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1 *</Label>
              <Input
                id="address_line1"
                placeholder="Street address"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                placeholder="Apartment, suite, etc."
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                placeholder="Postal code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="is_default" className="font-normal">
                Set as default address
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={addressMutation.isPending}>
                {addressMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingAddress ? "Update" : "Add"} Address
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressBook;