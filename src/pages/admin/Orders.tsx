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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Eye, MoreHorizontal, Printer, X, Truck, CheckCircle, Package, AlertCircle, ExternalLink, MapPin, Pencil, Plus, Trash2, Download, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(undefined);
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(undefined);

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

  // Get filtered orders based on date range
  const getFilteredOrders = () => {
    if (!exportStartDate && !exportEndDate) return orders;
    
    return orders.filter((order: any) => {
      const orderDate = new Date(order.created_at);
      if (exportStartDate && exportEndDate) {
        return isWithinInterval(orderDate, {
          start: startOfDay(exportStartDate),
          end: endOfDay(exportEndDate),
        });
      }
      if (exportStartDate) {
        return orderDate >= startOfDay(exportStartDate);
      }
      if (exportEndDate) {
        return orderDate <= endOfDay(exportEndDate);
      }
      return true;
    });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, order }: { id: string; status: string; order?: any }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      return { id, status, order };
    },
    onSuccess: async ({ id, status, order }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
      
      // Send status update email
      if (order?.customer_email) {
        try {
          await supabase.functions.invoke('send-order-status-email', {
            body: {
              customerEmail: order.customer_email,
              customerName: order.customer_name || 'Customer',
              orderId: id,
              status: status,
              trackingNumber: order.tracking_number,
              trackingUrl: order.tracking_url,
            },
          });
          console.log("Status update email sent for:", status);
        } catch (emailError) {
          console.error("Failed to send status update email:", emailError);
        }
      }
    },
    onError: (error) => {
      toast.error("Error updating order: " + error.message);
    },
  });

  const updateShippingMutation = useMutation({
    mutationFn: async ({ id, tracking_number, tracking_url, order }: { id: string; tracking_number: string; tracking_url: string; order?: any }) => {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "shipped",
          tracking_number,
          tracking_url 
        })
        .eq("id", id);
      if (error) throw error;
      return { id, tracking_number, tracking_url, order };
    },
    onSuccess: async ({ id, tracking_number, tracking_url, order }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order marked as shipped with tracking info");
      setShipDialogOpen(false);
      setSelectedOrder(null);
      setTrackingNumber("");
      setTrackingUrl("");

      // Send shipped email with tracking info
      if (order?.customer_email) {
        try {
          await supabase.functions.invoke('send-order-status-email', {
            body: {
              customerEmail: order.customer_email,
              customerName: order.customer_name || 'Customer',
              orderId: id,
              status: 'shipped',
              trackingNumber: tracking_number,
              trackingUrl: tracking_url,
            },
          });
          console.log("Shipped notification email sent");
        } catch (emailError) {
          console.error("Failed to send shipped email:", emailError);
        }
      }
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
      updateStatusMutation.mutate({ id: selectedOrder.id, status: "cancelled", order: selectedOrder });
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
        tracking_url: trackingUrl.trim(),
        order: selectedOrder
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

  // Export orders to PNG image with full details
  const exportOrdersToPNG = () => {
    const filteredOrders = getFilteredOrders();
    if (filteredOrders.length === 0) {
      toast.error("No orders to export in selected date range");
      return;
    }

    const ordersToExport = filteredOrders;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Failed to create canvas");
      return;
    }

    const padding = 40;
    const lineHeight = 22;
    const orderSpacing = 30;
    const sectionPadding = 15;

    // Calculate total height needed
    let totalContentHeight = 80; // Title
    ordersToExport.forEach((order: any) => {
      const items = order.items as OrderItem[];
      totalContentHeight += 120; // Order header info
      totalContentHeight += (items?.length || 0) * 80; // Each product
      totalContentHeight += orderSpacing;
    });

    const canvasWidth = 1200;
    canvas.width = canvasWidth;
    canvas.height = totalContentHeight + padding * 2;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "bold 28px Arial";
    const dateRangeText = exportStartDate || exportEndDate 
      ? ` (${exportStartDate ? format(exportStartDate, "dd/MM/yy") : "Start"} - ${exportEndDate ? format(exportEndDate, "dd/MM/yy") : "End"})`
      : "";
    ctx.fillText(`Orders Export - ${format(new Date(), "PPP")}${dateRangeText}`, padding, padding + 35);
    ctx.font = "14px Arial";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(`Total Orders: ${ordersToExport.length}`, padding, padding + 60);

    let currentY = padding + 90;

    ordersToExport.forEach((order: any, orderIndex) => {
      const items = order.items as OrderItem[];
      const orderIdShort = order.id.slice(0, 8).toUpperCase();

      // Order card background
      const cardHeight = 100 + (items?.length || 0) * 75;
      ctx.fillStyle = orderIndex % 2 === 0 ? "#f8fafc" : "#f1f5f9";
      ctx.fillRect(padding, currentY, canvasWidth - padding * 2, cardHeight);
      
      // Card border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.strokeRect(padding, currentY, canvasWidth - padding * 2, cardHeight);

      // Order ID badge
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(padding + sectionPadding, currentY + sectionPadding, 100, 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Arial";
      ctx.fillText(`#${orderIdShort}`, padding + sectionPadding + 10, currentY + sectionPadding + 19);

      // Status badge
      const statusColors: Record<string, string> = {
        pending: "#eab308",
        processing: "#3b82f6",
        shipped: "#8b5cf6",
        delivered: "#22c55e",
        cancelled: "#ef4444",
      };
      ctx.fillStyle = statusColors[order.status] || "#6b7280";
      ctx.fillRect(padding + sectionPadding + 110, currentY + sectionPadding, 90, 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Arial";
      ctx.fillText(order.status.toUpperCase(), padding + sectionPadding + 120, currentY + sectionPadding + 19);

      // Date
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px Arial";
      ctx.fillText(format(new Date(order.created_at), "PPP 'at' p"), padding + sectionPadding + 220, currentY + sectionPadding + 19);

      // Total
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`Total: Rs.${Number(order.total).toLocaleString()}`, canvasWidth - padding - sectionPadding - 180, currentY + sectionPadding + 19);

      currentY += 50;

      // Customer info section
      ctx.fillStyle = "#374151";
      ctx.font = "bold 13px Arial";
      ctx.fillText("Customer:", padding + sectionPadding, currentY + 5);
      ctx.font = "13px Arial";
      ctx.fillText(order.customer_name || "Guest", padding + sectionPadding + 80, currentY + 5);

      ctx.font = "bold 13px Arial";
      ctx.fillText("Email:", padding + sectionPadding + 250, currentY + 5);
      ctx.font = "13px Arial";
      ctx.fillText(order.customer_email || "-", padding + sectionPadding + 300, currentY + 5);

      ctx.font = "bold 13px Arial";
      ctx.fillText("Phone:", padding + sectionPadding + 550, currentY + 5);
      ctx.font = "13px Arial";
      ctx.fillText(order.customer_phone || "-", padding + sectionPadding + 600, currentY + 5);

      currentY += lineHeight;

      // Address
      ctx.font = "bold 13px Arial";
      ctx.fillText("Address:", padding + sectionPadding, currentY + 5);
      ctx.font = "13px Arial";
      const address = (order.shipping_address || "-").replace(/\n/g, ", ");
      const maxAddressWidth = canvasWidth - padding * 2 - sectionPadding - 80;
      ctx.fillText(address.slice(0, 120) + (address.length > 120 ? "..." : ""), padding + sectionPadding + 65, currentY + 5);

      currentY += lineHeight + 10;

      // Products header
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 13px Arial";
      ctx.fillText("Products:", padding + sectionPadding, currentY + 5);
      currentY += lineHeight;

      // Products
      items?.forEach((item, itemIndex) => {
        // Product row background
        ctx.fillStyle = itemIndex % 2 === 0 ? "#ffffff" : "#f9fafb";
        ctx.fillRect(padding + sectionPadding, currentY, canvasWidth - padding * 2 - sectionPadding * 2, 65);
        
        ctx.strokeStyle = "#e5e7eb";
        ctx.strokeRect(padding + sectionPadding, currentY, canvasWidth - padding * 2 - sectionPadding * 2, 65);

        // Product name
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 13px Arial";
        ctx.fillText(`${itemIndex + 1}. ${item.name}`, padding + sectionPadding + 10, currentY + 20);

        // Quantity and price
        ctx.font = "13px Arial";
        ctx.fillStyle = "#4b5563";
        ctx.fillText(`Qty: ${item.quantity}`, padding + sectionPadding + 10, currentY + 40);
        ctx.fillText(`Price: Rs.${item.price.toLocaleString()}`, padding + sectionPadding + 80, currentY + 40);
        ctx.fillText(`Subtotal: Rs.${(item.price * item.quantity).toLocaleString()}`, padding + sectionPadding + 220, currentY + 40);

        // Specifications
        if (item.specifications && Object.keys(item.specifications).length > 0) {
          const specs = Object.entries(item.specifications)
            .slice(0, 5)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ");
          ctx.fillStyle = "#6b7280";
          ctx.font = "11px Arial";
          ctx.fillText(`Specs: ${specs.slice(0, 100)}${specs.length > 100 ? "..." : ""}`, padding + sectionPadding + 10, currentY + 58);
        }

        currentY += 70;
      });

      currentY += orderSpacing;
    });

    // Download
    const link = document.createElement("a");
    link.download = `orders_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    toast.success(`Exported ${ordersToExport.length} orders to PNG`);
    setExportDialogOpen(false);
  };

  // Export orders to CSV with all details
  const exportOrdersToCSV = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const headers = [
      "Order ID",
      "Order Date",
      "Order Time",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Shipping Address",
      "Status",
      "Products",
      "Product Details",
      "Total Items",
      "Subtotal",
      "Total Amount",
      "Tracking Number",
      "Tracking URL",
    ];

    const rows = orders.map((order: any) => {
      const items = order.items as OrderItem[];
      const productNames = items?.map(item => item.name).join("; ") || "";
      const productDetails = items?.map(item => {
        const specs = item.specifications 
          ? Object.entries(item.specifications).map(([k, v]) => `${k}: ${v}`).join(", ")
          : "";
        return `${item.name} (Qty: ${item.quantity}, Price: Rs.${item.price}${specs ? `, ${specs}` : ""})`;
      }).join(" | ") || "";
      const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const subtotal = items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

      return [
        order.id.slice(0, 8).toUpperCase(),
        format(new Date(order.created_at), "yyyy-MM-dd"),
        format(new Date(order.created_at), "HH:mm:ss"),
        order.customer_name || "Guest",
        order.customer_email || "",
        order.customer_phone || "",
        (order.shipping_address || "").replace(/,/g, ";").replace(/\n/g, " "),
        order.status,
        productNames.replace(/,/g, ";"),
        productDetails.replace(/,/g, ";"),
        totalItems.toString(),
        subtotal.toString(),
        Number(order.total).toString(),
        order.tracking_number || "",
        order.tracking_url || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${orders.length} orders to CSV`);
  };

  // Export single order to detailed format
  const exportSingleOrder = (order: any) => {
    const items = order.items as OrderItem[];
    const orderIdShort = order.id.slice(0, 8).toUpperCase();
    
    const headers = [
      "Field",
      "Value",
    ];

    const orderInfo = [
      ["Order ID", `#${orderIdShort}`],
      ["Full Order ID", order.id],
      ["Order Date", format(new Date(order.created_at), "yyyy-MM-dd HH:mm:ss")],
      ["Status", order.status],
      ["", ""],
      ["CUSTOMER INFORMATION", ""],
      ["Customer Name", order.customer_name || "Guest"],
      ["Customer Email", order.customer_email || ""],
      ["Customer Phone", order.customer_phone || ""],
      ["Shipping Address", (order.shipping_address || "").replace(/\n/g, " ")],
      ["", ""],
      ["ORDER ITEMS", ""],
    ];

    // Add each item
    items?.forEach((item, index) => {
      orderInfo.push([`Item ${index + 1}`, item.name]);
      orderInfo.push([`  Quantity`, item.quantity.toString()]);
      orderInfo.push([`  Unit Price`, `Rs.${item.price.toLocaleString()}`]);
      orderInfo.push([`  Line Total`, `Rs.${(item.price * item.quantity).toLocaleString()}`]);
      if (item.specifications && Object.keys(item.specifications).length > 0) {
        Object.entries(item.specifications).forEach(([key, value]) => {
          orderInfo.push([`  ${key}`, value]);
        });
      }
    });

    orderInfo.push(["", ""]);
    orderInfo.push(["TOTALS", ""]);
    orderInfo.push(["Total Items", items?.reduce((sum, item) => sum + item.quantity, 0).toString() || "0"]);
    orderInfo.push(["Order Total", `Rs.${Number(order.total).toLocaleString()}`]);
    
    if (order.tracking_number) {
      orderInfo.push(["", ""]);
      orderInfo.push(["SHIPPING", ""]);
      orderInfo.push(["Tracking Number", order.tracking_number]);
      orderInfo.push(["Tracking URL", order.tracking_url || ""]);
    }

    const csvContent = [
      headers.join(","),
      ...orderInfo.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `order_${orderIdShort}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported order #${orderIdShort}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground">View and manage customer orders</p>
          </div>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <Download className="h-4 w-4 mr-2" />
                Export Orders (PNG)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Orders</DialogTitle>
                <DialogDescription>
                  Select a date range to filter orders, or export all orders.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !exportStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {exportStartDate ? format(exportStartDate, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={exportStartDate}
                        onSelect={setExportStartDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !exportEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {exportEndDate ? format(exportEndDate, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={exportEndDate}
                        onSelect={setExportEndDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {(exportStartDate || exportEndDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setExportStartDate(undefined);
                      setExportEndDate(undefined);
                    }}
                  >
                    Clear date filter
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  {getFilteredOrders().length} orders will be exported
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={exportOrdersToPNG}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PNG
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                            updateStatusMutation.mutate({ id: order.id, status, order })
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
                              <DropdownMenuItem onClick={() => exportSingleOrder(order)}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Order
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
