import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Printer, X, Truck, CheckCircle, Package, AlertCircle, ExternalLink, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  specifications?: Record<string, string>;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  processing: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  shipped: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  delivered: "bg-green-500/10 text-green-600 border-green-500/30",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/30",
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [editSpecsDialogOpen, setEditSpecsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [editingSpecs, setEditingSpecs] = useState<Record<string, string>>({});
  const [cancelReason, setCancelReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: (error) => {
      toast.error("Error updating order: " + error.message);
    },
  });

  const updateShippingMutation = useMutation({
    mutationFn: async ({ id, tracking_number, tracking_url }: { id: string; tracking_number: string; tracking_url: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "shipped",
          tracking_number,
          tracking_url 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order marked as shipped with tracking info");
      setShipDialogOpen(false);
      setSelectedOrder(null);
      setTrackingNumber("");
      setTrackingUrl("");
    },
    onError: (error) => {
      toast.error("Error updating order: " + error.message);
    },
  });

  const updateTrackingMutation = useMutation({
    mutationFn: async ({ id, tracking_number, tracking_url }: { id: string; tracking_number: string; tracking_url: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ tracking_number, tracking_url })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Tracking info updated");
    },
    onError: (error) => {
      toast.error("Error updating tracking: " + error.message);
    },
  });

  const updateItemSpecsMutation = useMutation({
    mutationFn: async ({ orderId, items }: { orderId: string; items: OrderItem[] }) => {
      const { error } = await supabase
        .from("orders")
        .update({ items: items as any })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Specifications updated");
      setEditSpecsDialogOpen(false);
      setSelectedOrder(null);
      setSelectedItemIndex(null);
      setEditingSpecs({});
    },
    onError: (error) => {
      toast.error("Error updating specifications: " + error.message);
    },
  });

  const openEditSpecsDialog = (order: any, itemIndex: number) => {
    const items = order.items as OrderItem[];
    setSelectedOrder(order);
    setSelectedItemIndex(itemIndex);
    setEditingSpecs(items[itemIndex].specifications || {});
    setEditSpecsDialogOpen(true);
  };

  const handleAddSpec = () => {
    setEditingSpecs(prev => ({ ...prev, "": "" }));
  };

  const handleUpdateSpecKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    setEditingSpecs(prev => {
      const newSpecs: Record<string, string> = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (k === oldKey) {
          newSpecs[newKey] = v;
        } else {
          newSpecs[k] = v;
        }
      });
      return newSpecs;
    });
  };

  const handleUpdateSpecValue = (key: string, value: string) => {
    setEditingSpecs(prev => ({ ...prev, [key]: value }));
  };

  const handleRemoveSpec = (key: string) => {
    setEditingSpecs(prev => {
      const newSpecs = { ...prev };
      delete newSpecs[key];
      return newSpecs;
    });
  };

  const handleSaveSpecs = () => {
    if (!selectedOrder || selectedItemIndex === null) return;
    
    // Filter out empty keys
    const cleanedSpecs: Record<string, string> = {};
    Object.entries(editingSpecs).forEach(([k, v]) => {
      if (k.trim()) {
        cleanedSpecs[k.trim()] = v;
      }
    });

    const items = [...(selectedOrder.items as OrderItem[])];
    items[selectedItemIndex] = {
      ...items[selectedItemIndex],
      specifications: cleanedSpecs,
    };
    
    updateItemSpecsMutation.mutate({ orderId: selectedOrder.id, items });
  };

  const handlePrintOrder = (order: any) => {
    const items = order.items as OrderItem[];
    const printContent = `
      <html>
        <head>
          <title>Order #${order.id.slice(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Order #${order.id.slice(0, 8)}</h1>
          <p><strong>Date:</strong> ${format(new Date(order.created_at), "PPP")}</p>
          <p><strong>Customer:</strong> ${order.customer_name || "Guest"}</p>
          <p><strong>Email:</strong> ${order.customer_email || "-"}</p>
          <p><strong>Phone:</strong> ${order.customer_phone || "-"}</p>
          <p><strong>Address:</strong> ${order.shipping_address || "-"}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          ${order.tracking_number ? `<p><strong>Tracking:</strong> ${order.tracking_number}</p>` : ''}
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Specifications</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items?.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="font-size: 11px;">${item.specifications ? Object.entries(item.specifications).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(', ') : '-'}</td>
                  <td>${item.quantity}</td>
                  <td>Rs.${item.price.toLocaleString()}</td>
                  <td>Rs.${(item.quantity * item.price).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="total">Total: Rs.${Number(order.total).toLocaleString()}</p>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCancelOrder = () => {
    if (selectedOrder) {
      updateStatusMutation.mutate({ id: selectedOrder.id, status: "cancelled" });
      setCancelDialogOpen(false);
      setSelectedOrder(null);
      setCancelReason("");
    }
  };

  const handleShipOrder = () => {
    if (selectedOrder) {
      updateShippingMutation.mutate({ 
        id: selectedOrder.id, 
        tracking_number: trackingNumber.trim(),
        tracking_url: trackingUrl.trim()
      });
    }
  };

  const handleQuickStatusUpdate = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ id: orderId, status });
  };

  const openShipDialog = (order: any) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || "");
    setTrackingUrl(order.tracking_url || "");
    setShipDialogOpen(true);
  };

  const getItemsSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return "No items";
    if (items.length === 1) return items[0].name;
    return `${items[0].name} +${items.length - 1} more`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">View and manage customer orders</p>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: any) => {
                  const items = order.items as OrderItem[];
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name || "Guest"}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {items?.[0]?.image_url && (
                            <img 
                              src={items[0].image_url} 
                              alt={items[0].name}
                              className="w-10 h-10 rounded object-contain bg-secondary/50"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium max-w-[200px] truncate">
                              {getItemsSummary(items)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        Rs.{Number(order.total).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(status) => 
                            updateStatusMutation.mutate({ id: order.id, status })
                          }
                        >
                          <SelectTrigger className={`w-32 h-8 text-xs border ${statusColors[order.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Order Details - #{order.id.slice(0, 8)}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Order ID</p>
                                    <p className="font-mono text-xs">{order.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Date</p>
                                    <p>{format(new Date(order.created_at), "PPP")}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[order.status]}`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Customer</p>
                                    <p className="font-medium">{order.customer_name || "Guest"}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p>{order.customer_email || "-"}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Phone</p>
                                    <p>{order.customer_phone || "-"}</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-muted-foreground text-sm mb-2">Shipping Address</p>
                                  <p className="text-sm bg-secondary/30 p-3 rounded-lg">{order.shipping_address || "-"}</p>
                                </div>

                                {/* Tracking Info */}
                                {(order.tracking_number || order.status === "shipped" || order.status === "delivered") && (
                                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MapPin className="h-4 w-4 text-purple-600" />
                                      <p className="font-medium text-purple-600">Tracking Information</p>
                                    </div>
                                    {order.tracking_number ? (
                                      <div className="space-y-2">
                                        <p className="text-sm">
                                          <span className="text-muted-foreground">Tracking #: </span>
                                          <span className="font-mono font-medium">{order.tracking_number}</span>
                                        </p>
                                        {order.tracking_url && (
                                          <a 
                                            href={order.tracking_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                          >
                                            Track Package <ExternalLink className="h-3 w-3" />
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No tracking information added yet</p>
                                    )}
                                  </div>
                                )}

                                <div>
                                  <p className="text-muted-foreground text-sm mb-3">Order Items</p>
                                  <div className="space-y-3 bg-secondary/20 rounded-lg p-3">
                                      {items?.map((item: OrderItem, i: number) => (
                                        <div key={i} className="pb-3 border-b border-border last:border-0 last:pb-0">
                                          <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 rounded-lg bg-background overflow-hidden flex-shrink-0">
                                              <img 
                                                src={item.image_url || '/placeholder.svg'} 
                                                alt={item.name}
                                                className="w-full h-full object-contain"
                                              />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-sm">{item.name}</p>
                                              <p className="text-xs text-muted-foreground">
                                                Qty: {item.quantity} × Rs.{Number(item.price).toLocaleString()}
                                              </p>
                                            </div>
                                            <p className="font-semibold">
                                              Rs.{(item.price * item.quantity).toLocaleString()}
                                            </p>
                                          </div>
                                          {/* Specifications */}
                                          <div className="mt-2 ml-[68px] bg-muted/50 rounded-md p-2">
                                            <div className="flex items-center justify-between mb-1">
                                              <p className="text-xs font-medium text-muted-foreground">Specifications:</p>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 px-2 text-xs"
                                                onClick={() => openEditSpecsDialog(order, i)}
                                              >
                                                <Pencil className="h-3 w-3 mr-1" />
                                                Edit
                                              </Button>
                                            </div>
                                            {item.specifications && Object.keys(item.specifications).length > 0 ? (
                                              <>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                  {Object.entries(item.specifications).slice(0, 6).map(([key, value]) => (
                                                    <div key={key} className="text-xs">
                                                      <span className="text-muted-foreground">{key}: </span>
                                                      <span className="font-medium">{value}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                                {Object.keys(item.specifications).length > 6 && (
                                                  <p className="text-xs text-muted-foreground mt-1">
                                                    +{Object.keys(item.specifications).length - 6} more
                                                  </p>
                                                )}
                                              </>
                                            ) : (
                                              <p className="text-xs text-muted-foreground italic">No specifications added</p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>

                                <div className="flex justify-between font-bold pt-2 border-t border-border text-lg">
                                  <span>Total</span>
                                  <span className="text-primary">Rs.{Number(order.total).toLocaleString()}</span>
                                </div>
                              </div>
                              <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => handlePrintOrder(order)}>
                                  <Printer className="h-4 w-4 mr-2" />
                                  Print
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handlePrintOrder(order)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Order
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleQuickStatusUpdate(order.id, "processing")}
                                disabled={order.status === "processing" || order.status === "cancelled"}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                Mark Processing
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openShipDialog(order)}
                                disabled={order.status === "cancelled"}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                {order.status === "shipped" ? "Update Tracking" : "Mark Shipped"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleQuickStatusUpdate(order.id, "delivered")}
                                disabled={order.status === "delivered" || order.status === "cancelled"}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Delivered
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setCancelDialogOpen(true);
                                }}
                                disabled={order.status === "cancelled" || order.status === "delivered"}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order #{selectedOrder?.id.slice(0, 8)}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Reason (optional)</Label>
              <Textarea
                id="cancelReason"
                placeholder="Enter reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder}>
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Order Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              {selectedOrder?.status === "shipped" ? "Update Tracking Info" : "Ship Order"}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.status === "shipped" 
                ? "Update the tracking information for this order."
                : "Add tracking details and mark order as shipped."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                placeholder="e.g., TCS-123456789"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="trackingUrl">Tracking URL (optional)</Label>
              <Input
                id="trackingUrl"
                placeholder="e.g., https://tracking.tcs.com.pk/..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste the full tracking link so customers can track their package
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleShipOrder}
              disabled={updateShippingMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Truck className="h-4 w-4 mr-2" />
              {selectedOrder?.status === "shipped" ? "Update Tracking" : "Mark as Shipped"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Specifications Dialog */}
      <Dialog open={editSpecsDialogOpen} onOpenChange={setEditSpecsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Specifications</DialogTitle>
            <DialogDescription>
              {selectedOrder && selectedItemIndex !== null && (
                <span>
                  Editing specs for: {(selectedOrder.items as OrderItem[])[selectedItemIndex]?.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="max-h-[300px] pr-4">
              <div className="space-y-3">
                {Object.entries(editingSpecs).map(([key, value], index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Key (e.g., Color)"
                      value={key}
                      onChange={(e) => handleUpdateSpecKey(key, e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value (e.g., Black)"
                      value={value}
                      onChange={(e) => handleUpdateSpecValue(key, e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleRemoveSpec(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button 
              variant="outline" 
              onClick={handleAddSpec}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Specification
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSpecsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSpecs}
              disabled={updateItemSpecsMutation.isPending}
            >
              Save Specifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
