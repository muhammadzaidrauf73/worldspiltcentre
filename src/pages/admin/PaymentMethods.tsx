import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, CreditCard, GripVertical } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface PaymentMethod {
  id: string;
  method_key: string;
  label: string;
  description: string | null;
  icon: string;
  logo_url: string | null;
  account_title: string | null;
  account_number: string | null;
  iban: string | null;
  bank_name: string | null;
  is_active: boolean;
  display_order: number;
}

const emptyForm = {
  method_key: "",
  label: "",
  description: "",
  icon: "💳",
  logo_url: "",
  account_title: "",
  account_number: "",
  iban: "",
  bank_name: "",
  is_active: true,
  display_order: 0,
};

const AdminPaymentMethods = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof emptyForm & { id?: string }) => {
      const payload = {
        method_key: data.method_key,
        label: data.label,
        description: data.description || null,
        icon: data.icon || "💳",
        logo_url: data.logo_url || null,
        account_title: data.account_title || null,
        account_number: data.account_number || null,
        iban: data.iban || null,
        bank_name: data.bank_name || null,
        is_active: data.is_active,
        display_order: data.display_order,
      };

      if (data.id) {
        const { error } = await supabase
          .from("payment_methods")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_methods")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success(editingMethod ? "Payment method updated" : "Payment method added");
      closeDialog();
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method deleted");
      setDeleteDialogOpen(false);
      setDeletingMethod(null);
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const openAdd = () => {
    setEditingMethod(null);
    setForm({ ...emptyForm, display_order: methods.length });
    setDialogOpen(true);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setForm({
      method_key: method.method_key,
      label: method.label,
      description: method.description || "",
      icon: method.icon || "💳",
      logo_url: method.logo_url || "",
      account_title: method.account_title || "",
      account_number: method.account_number || "",
      iban: method.iban || "",
      bank_name: method.bank_name || "",
      is_active: method.is_active,
      display_order: method.display_order,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingMethod(null);
    setForm(emptyForm);
  };

  const handleSave = () => {
    if (!form.method_key.trim() || !form.label.trim()) {
      toast.error("Key and label are required");
      return;
    }
    saveMutation.mutate({ ...form, id: editingMethod?.id });
  };

  const openDelete = (method: PaymentMethod) => {
    setDeletingMethod(method);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Methods</h1>
            <p className="text-muted-foreground">Manage payment options shown to customers</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Bank / Provider</TableHead>
                <TableHead>Account Title</TableHead>
                <TableHead>Account #</TableHead>
                <TableHead>IBAN</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : methods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No payment methods configured
                  </TableCell>
                </TableRow>
              ) : (
                methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="text-muted-foreground">{method.display_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{method.icon}</span>
                        {method.logo_url && (
                          <img src={method.logo_url} alt={method.label} className="h-6 w-auto object-contain" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{method.label}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{method.method_key}</TableCell>
                    <TableCell>{method.bank_name || "-"}</TableCell>
                    <TableCell>{method.account_title || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{method.account_number || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{method.iban || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${method.is_active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                        {method.is_active ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(method)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(method)}>
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

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMethod ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
              <DialogDescription>
                {editingMethod ? "Update the payment method details below." : "Fill in the details for the new payment method."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Method Key *</Label>
                  <Input
                    value={form.method_key}
                    onChange={(e) => setForm({ ...form, method_key: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                    placeholder="e.g. jazzcash"
                    disabled={!!editingMethod}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Unique identifier (cannot change after creation)</p>
                </div>
                <div>
                  <Label>Display Label *</Label>
                  <Input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. JazzCash"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Pay via JazzCash mobile wallet"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Icon (emoji)</Label>
                  <Input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="💳"
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Logo Image</Label>
                <ImageUpload
                  value={form.logo_url}
                  onChange={(url) => setForm({ ...form, logo_url: url })}
                  bucket="product-images"
                  folder="payment-logos"
                />
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3">Account Details (shown to customers)</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Bank / Provider Name</Label>
                    <Input
                      value={form.bank_name}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      placeholder="e.g. Meezan Bank"
                    />
                  </div>
                  <div>
                    <Label>Account Title</Label>
                    <Input
                      value={form.account_title}
                      onChange={(e) => setForm({ ...form, account_title: e.target.value })}
                      placeholder="e.g. Khalil Ahmad"
                    />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      value={form.account_number}
                      onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                      placeholder="e.g. 03004649141"
                    />
                  </div>
                  <div>
                    <Label>IBAN</Label>
                    <Input
                      value={form.iban}
                      onChange={(e) => setForm({ ...form, iban: e.target.value })}
                      placeholder="e.g. PK19MEZN0002810110983695"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingMethod ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Payment Method</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingMethod?.label}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => deletingMethod && deleteMutation.mutate(deletingMethod.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentMethods;
