import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FolderTree, ShoppingCart, Users, TrendingUp, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [productsRes, categoriesRes, ordersRes, customersRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, status, created_at"),
        supabase.from("profiles").select("id, created_at"),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const pendingOrders = ordersRes.data?.filter(o => o.status === "pending").length || 0;

      return {
        products: productsRes.count || 0,
        categories: categoriesRes.count || 0,
        orders: ordersRes.data?.length || 0,
        pendingOrders,
        totalRevenue,
        customers: customersRes.data?.length || 0,
        ordersData: ordersRes.data || [],
        customersData: customersRes.data || [],
      };
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ["admin-top-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, reviews_count")
        .order("reviews_count", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // Generate sales trend data for last 7 days
  const salesTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayOrders = stats?.ordersData?.filter(order => {
      const orderDate = startOfDay(new Date(order.created_at));
      return orderDate.getTime() === dayStart.getTime();
    }) || [];
    
    return {
      date: format(date, "MMM d"),
      sales: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
      orders: dayOrders.length,
    };
  });

  // Customer growth data
  const customerGrowthData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const newCustomers = stats?.customersData?.filter(customer => {
      const customerDate = startOfDay(new Date(customer.created_at));
      return customerDate.getTime() === dayStart.getTime();
    }).length || 0;
    
    return {
      date: format(date, "MMM d"),
      customers: newCustomers,
    };
  });

  // Order status distribution
  const orderStatusData = [
    { name: "Pending", value: stats?.ordersData?.filter(o => o.status === "pending").length || 0, color: "hsl(var(--chart-1))" },
    { name: "Processing", value: stats?.ordersData?.filter(o => o.status === "processing").length || 0, color: "hsl(var(--chart-2))" },
    { name: "Shipped", value: stats?.ordersData?.filter(o => o.status === "shipped").length || 0, color: "hsl(var(--chart-3))" },
    { name: "Delivered", value: stats?.ordersData?.filter(o => o.status === "delivered").length || 0, color: "hsl(var(--chart-4))" },
    { name: "Cancelled", value: stats?.ordersData?.filter(o => o.status === "cancelled").length || 0, color: "hsl(var(--chart-5))" },
  ].filter(item => item.value > 0);

  const statCards = [
    { title: "Total Revenue", value: `Rs.${stats?.totalRevenue.toLocaleString() || 0}`, icon: DollarSign, color: "text-green-500" },
    { title: "Total Orders", value: stats?.orders || 0, icon: ShoppingCart, color: "text-blue-500" },
    { title: "Total Products", value: stats?.products || 0, icon: Package, color: "text-purple-500" },
    { title: "Total Customers", value: stats?.customers || 0, icon: Users, color: "text-orange-500" },
  ];

  const chartConfig = {
    sales: { label: "Sales", color: "hsl(var(--chart-1))" },
    orders: { label: "Orders", color: "hsl(var(--chart-2))" },
    customers: { label: "Customers", color: "hsl(var(--chart-3))" },
  };

  const SimplePieTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
      <div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
        <div className="font-medium">{item.name}</div>
        <div className="text-muted-foreground">{item.value}</div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store analytics</p>
        </div>

        {/* Stats Cards */}
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

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Sales Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Sales Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <LineChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={50} tickFormatter={(value) => `${value}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="var(--color-sales)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-sales)", r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Orders Per Day */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" />
                Orders Per Day
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <BarChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={30} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Customer Growth */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Customer Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <Skeleton className="h-[180px] w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-[180px] w-full">
                  <BarChart data={customerGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis tickLine={false} axisLine={false} fontSize={10} width={25} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="customers" fill="var(--color-customers)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <Skeleton className="h-[180px] w-full" />
              ) : orderStatusData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="h-[130px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {orderStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<SimplePieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                    {orderStatusData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                  No order data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Popular Products
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <Skeleton className="h-[180px] w-full" />
              ) : topProducts && topProducts.length > 0 ? (
                <div className="space-y-2">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-muted-foreground w-4 shrink-0">
                          {index + 1}.
                        </span>
                        <span className="text-sm font-medium truncate">
                          {product.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-sm font-bold">Rs.{product.price.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{product.reviews_count || 0} reviews</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                  No products yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
