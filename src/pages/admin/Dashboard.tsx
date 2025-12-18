import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FolderTree, ShoppingCart, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [productsRes, categoriesRes, ordersRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, status"),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const pendingOrders = ordersRes.data?.filter(o => o.status === "pending").length || 0;

      return {
        products: productsRes.count || 0,
        categories: categoriesRes.count || 0,
        orders: ordersRes.data?.length || 0,
        pendingOrders,
        totalRevenue,
      };
    },
  });

  const statCards = [
    { title: "Total Products", value: stats?.products || 0, icon: Package, color: "text-blue-500" },
    { title: "Categories", value: stats?.categories || 0, icon: FolderTree, color: "text-green-500" },
    { title: "Total Orders", value: stats?.orders || 0, icon: ShoppingCart, color: "text-orange-500" },
    { title: "Pending Orders", value: stats?.pendingOrders || 0, icon: Users, color: "text-red-500" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-40" />
            ) : (
              <div className="text-3xl font-bold text-primary">
                Rs.{stats?.totalRevenue.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
