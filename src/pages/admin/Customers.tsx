import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, Phone, MapPin, Calendar, Search, Download, Mail, Loader2, 
  ChevronDown, ChevronUp, Package, Eye, ShoppingBag, User
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  items: any;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  tracking_number: string | null;
}

const AdminCustomers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const handleSendBulkWelcomeEmails = async () => {
    if (!confirm("Send welcome emails to all registered users? This will send an email to every user.")) {
      return;
    }

    setIsSendingEmails(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-bulk-welcome-emails");
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Welcome emails sent! ${data.sent} sent, ${data.failed} failed out of ${data.total} users.`);
        if (data.errors?.length > 0) {
          console.error("Email errors:", data.errors);
        }
      } else {
        throw new Error(data.error || "Failed to send emails");
      }
    } catch (error: any) {
      console.error("Error sending bulk emails:", error);
      toast.error(`Failed to send emails: ${error.message}`);
    } finally {
      setIsSendingEmails(false);
    }
  };

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-customers");
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch customers");
      return data.customers || [];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-customer-orders-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  // Group orders by customer
  const ordersByCustomer = useMemo(() => {
    return orders.reduce((acc, order) => {
      if (order.user_id) {
        if (!acc[order.user_id]) {
          acc[order.user_id] = [];
        }
        acc[order.user_id].push(order);
      }
      return acc;
    }, {} as Record<string, Order[]>);
  }, [orders]);

  // Calculate order stats per customer
  const customerStats = useMemo(() => {
    return orders.reduce((acc, order) => {
      if (order.user_id) {
        if (!acc[order.user_id]) {
          acc[order.user_id] = { count: 0, total: 0 };
        }
        acc[order.user_id].count += 1;
        acc[order.user_id].total += Number(order.total);
      }
      return acc;
    }, {} as Record<string, { count: number; total: number }>);
  }, [orders]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer: any) => {
      const stats = customerStats[customer.id] || { count: 0, total: 0 };
      
      const matchesSearch =
        searchQuery === "" ||
        customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOrderFilter =
        orderFilter === "all" ||
        (orderFilter === "with-orders" && stats.count > 0) ||
        (orderFilter === "no-orders" && stats.count === 0);

      return matchesSearch && matchesOrderFilter;
    });
  }, [customers, customerStats, searchQuery, orderFilter]);

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Address", "Orders", "Total Spent", "Joined Date"];
    const rows = filteredCustomers.map((customer: any) => {
      const stats = customerStats[customer.id] || { count: 0, total: 0 };
      return [
        customer.full_name || "No name",
        customer.email || "",
        customer.phone || "",
        customer.address?.replace(/,/g, ";") || "",
        stats.count.toString(),
        stats.total.toString(),
        format(new Date(customer.created_at), "yyyy-MM-dd"),
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
    link.setAttribute("download", `customers_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredCustomers.length} customers to CSV`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const parseOrderItems = (items: any): OrderItem[] => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (items.products && Array.isArray(items.products)) return items.products;
    return [];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-8 w-8" />
              Customers
            </h1>
            <p className="text-muted-foreground">
              Manage registered customers and view their order history
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button 
              onClick={handleSendBulkWelcomeEmails} 
              variant="outline" 
              disabled={isSendingEmails}
            >
              {isSendingEmails ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send Welcome Emails
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Customers</p>
            <p className="text-2xl font-bold text-foreground">{customers.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">With Orders</p>
            <p className="text-2xl font-bold text-foreground">
              {Object.keys(customerStats).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-primary">
              Rs.{Object.values(customerStats).reduce((sum, s) => sum + s.total, 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={orderFilter} onValueChange={setOrderFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="with-orders">With Orders</SelectItem>
              <SelectItem value="no-orders">No Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Address</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer: any) => {
                  const stats = customerStats[customer.id] || { count: 0, total: 0 };
                  const customerOrders = ordersByCustomer[customer.id] || [];
                  const isExpanded = expandedCustomer === customer.id;

                  return (
                    <Collapsible key={customer.id} open={isExpanded} onOpenChange={() => setExpandedCustomer(isExpanded ? null : customer.id)}>
                      <TableRow className={isExpanded ? "bg-muted/30" : ""}>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={customerOrders.length === 0}>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-primary/20">
                              <AvatarImage src={customer.avatar_url} alt={customer.full_name || "Customer"} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {(customer.full_name || customer.email || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">
                                {customer.full_name || "No name"}
                              </p>
                              <p className="text-xs text-muted-foreground md:hidden truncate max-w-[150px]">
                                {customer.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="truncate max-w-[180px]">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {customer.address ? (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground max-w-[200px]">
                              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{customer.address}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={stats.count > 0 ? "default" : "secondary"} className="font-medium">
                            {stats.count} orders
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary">
                            Rs.{stats.total.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(customer.created_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Order Details */}
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={8} className="p-0">
                            <div className="p-4 space-y-3">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                Order History ({customerOrders.length} orders)
                              </h4>
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {customerOrders.map((order) => {
                                  const orderItems = parseOrderItems(order.items);
                                  return (
                                    <div key={order.id} className="bg-card border border-border rounded-lg p-3">
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-3">
                                          <span className="font-mono text-xs text-muted-foreground">
                                            #{order.id.slice(0, 8).toUpperCase()}
                                          </span>
                                          <Badge className={getStatusColor(order.status)}>
                                            {order.status}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {format(new Date(order.created_at), "MMM d, yyyy h:mm a")}
                                          </span>
                                        </div>
                                        <span className="font-semibold text-primary">
                                          Rs.{Number(order.total).toLocaleString()}
                                        </span>
                                      </div>
                                      
                                      {/* Order Items */}
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {orderItems.slice(0, 4).map((item, idx) => (
                                          <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1">
                                            {item.image_url && (
                                              <img src={item.image_url} alt={item.name} className="h-6 w-6 object-cover rounded" />
                                            )}
                                            <span className="text-xs">
                                              {item.name} x{item.quantity}
                                            </span>
                                          </div>
                                        ))}
                                        {orderItems.length > 4 && (
                                          <span className="text-xs text-muted-foreground self-center">
                                            +{orderItems.length - 4} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <User className="h-5 w-5" />
              Customer Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Profile Card */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                  <AvatarImage src={selectedCustomer.avatar_url} alt={selectedCustomer.full_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {(selectedCustomer.full_name || selectedCustomer.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedCustomer.full_name || "No name"}</h3>
                  <p className="text-sm text-muted-foreground">
                    Customer since {format(new Date(selectedCustomer.created_at), "MMMM yyyy")}
                  </p>
                  <div className="flex gap-4 mt-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {(customerStats[selectedCustomer.id]?.count || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        Rs.{(customerStats[selectedCustomer.id]?.total || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h4>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedCustomer.email || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedCustomer.phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedCustomer.address || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Order History ({ordersByCustomer[selectedCustomer.id]?.length || 0} orders)
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {(ordersByCustomer[selectedCustomer.id] || []).length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No orders yet</p>
                  ) : (
                    (ordersByCustomer[selectedCustomer.id] || []).map((order) => {
                      const orderItems = parseOrderItems(order.items);
                      return (
                        <div key={order.id} className="bg-card border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            </div>
                            <span className="font-bold text-primary">Rs.{Number(order.total).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
                          </p>
                          <div className="space-y-2">
                            {orderItems.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="h-10 w-10 object-cover rounded" />
                                ) : (
                                  <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-medium">Rs.{(item.price * item.quantity).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                          {order.shipping_address && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">Shipped to:</p>
                              <p className="text-sm">{order.shipping_address}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCustomers;
