import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

const AdminCustomers = () => {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
  const customerStats = orders.reduce((acc, order) => {
    if (order.user_id) {
      if (!acc[order.user_id]) {
        acc[order.user_id] = { count: 0, total: 0 };
      }
      acc[order.user_id].count += 1;
      acc[order.user_id].total += Number(order.total);
    }
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8" />
            Customers
          </h1>
          <p className="text-muted-foreground">
            Manage registered customers and view their order history
          </p>
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
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => {
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
                                {(customer.full_name || "U").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {customer.full_name || "No name"}
                            </p>
                            <p className="text-xs text-muted-foreground md:hidden">
                              {customer.phone || "No phone"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
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
