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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, MapPin, Calendar, Search, Download, Mail, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const AdminCustomers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [isSendingEmails, setIsSendingEmails] = useState(false);

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
    queryKey: ["admin-customer-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("user_id, total");
      if (error) throw error;
      return data;
    },
  });

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Address</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer: any) => {
                  const stats = customerStats[customer.id] || { count: 0, total: 0 };
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {customer.avatar_url ? (
                              <img 
                                src={customer.avatar_url} 
                                alt={customer.full_name || "Customer"} 
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-primary">
                                {(customer.full_name || customer.email || "U").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
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
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {customer.address ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground max-w-[200px] truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {customer.address}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stats.count > 0 ? "default" : "secondary"}>
                          {stats.count} orders
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          Rs.{stats.total.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(customer.created_at), "MMM d, yyyy")}
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

export default AdminCustomers;
