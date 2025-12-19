import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package, ShoppingCart, Users, TrendingUp, DollarSign, CalendarIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, BarChart, Bar } from "recharts";
import { format, subDays, startOfDay, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats", dateRange],
    queryFn: async () => {
      const [productsRes, categoriesRes, ordersRes, customersRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, status, created_at"),
        supabase.from("profiles").select("id, created_at"),
      ]);

      // Filter orders by date range
      const filteredOrders = ordersRes.data?.filter(order => {
        if (!dateRange?.from) return true;
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, {
          start: startOfDay(dateRange.from),
          end: dateRange.to ? startOfDay(subDays(dateRange.to, -1)) : startOfDay(subDays(dateRange.from, -1)),
        });
      }) || [];

      const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const pendingOrders = filteredOrders.filter(o => o.status === "pending").length;
      const completedOrders = filteredOrders.filter(o => o.status === "delivered").length;

      // Filter customers by date range
      const filteredCustomers = customersRes.data?.filter(customer => {
        if (!dateRange?.from) return true;
        const customerDate = new Date(customer.created_at);
        return isWithinInterval(customerDate, {
          start: startOfDay(dateRange.from),
          end: dateRange.to ? startOfDay(subDays(dateRange.to, -1)) : startOfDay(subDays(dateRange.from, -1)),
        });
      }) || [];

      return {
        products: productsRes.count || 0,
        categories: categoriesRes.count || 0,
        orders: filteredOrders.length,
        pendingOrders,
        completedOrders,
        totalRevenue,
        customers: filteredCustomers.length,
        allCustomers: customersRes.data?.length || 0,
        ordersData: filteredOrders,
        customersData: filteredCustomers,
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

  // Generate chart data based on date range
  const getDaysInRange = () => {
    if (!dateRange?.from) return 7;
    if (!dateRange.to) return 1;
    return Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const chartData = Array.from({ length: getDaysInRange() }, (_, i) => {
    const date = subDays(dateRange?.to || new Date(), getDaysInRange() - 1 - i);
    const dayStart = startOfDay(date);
    const dayOrders = stats?.ordersData?.filter(order => {
      const orderDate = startOfDay(new Date(order.created_at));
      return orderDate.getTime() === dayStart.getTime();
    }) || [];
    
    const newCustomers = stats?.customersData?.filter(customer => {
      const customerDate = startOfDay(new Date(customer.created_at));
      return customerDate.getTime() === dayStart.getTime();
    }).length || 0;

    return {
      date: format(date, "MMM d"),
      revenue: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
      orders: dayOrders.length,
      customers: newCustomers,
    };
  });

  // Order status counts
  const orderStatusCounts = {
    pending: stats?.ordersData?.filter(o => o.status === "pending").length || 0,
    processing: stats?.ordersData?.filter(o => o.status === "processing").length || 0,
    shipped: stats?.ordersData?.filter(o => o.status === "shipped").length || 0,
    delivered: stats?.ordersData?.filter(o => o.status === "delivered").length || 0,
    cancelled: stats?.ordersData?.filter(o => o.status === "cancelled").length || 0,
  };

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(142, 76%, 36%)" },
    orders: { label: "Orders", color: "hsl(221, 83%, 53%)" },
    customers: { label: "Customers", color: "hsl(262, 83%, 58%)" },
  };

  const presetRanges = [
    { label: "7 Days", days: 7 },
    { label: "14 Days", days: 14 },
    { label: "30 Days", days: 30 },
    { label: "90 Days", days: 90 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Store analytics overview</p>
          </div>
          
          <div className="flex items-center gap-2">
            {presetRanges.map((preset) => (
              <Button
                key={preset.days}
                variant={getDaysInRange() === preset.days ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange({
                  from: subDays(new Date(), preset.days - 1),
                  to: new Date(),
                })}
              >
                {preset.label}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Custom"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-emerald-600">
                    Rs.{stats?.totalRevenue.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.completedOrders || 0} completed orders
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">{stats?.orders || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.pendingOrders || 0} pending
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
              <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-violet-600">+{stats?.customers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.allCustomers || 0} total customers
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Package className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600">{stats?.products || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.categories || 0} categories
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Daily revenue for selected period</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">
                  Rs.{stats?.totalRevenue.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total revenue</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} width={60} tickFormatter={(v) => `Rs.${v}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders & Customers Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Orders</CardTitle>
                <span className="text-2xl font-bold text-blue-600">{stats?.orders || 0}</span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[180px] w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-[180px] w-full">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis tickLine={false} axisLine={false} fontSize={10} width={25} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="orders" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">New Customers</CardTitle>
                <span className="text-2xl font-bold text-violet-600">+{stats?.customers || 0}</span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[180px] w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-[180px] w-full">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis tickLine={false} axisLine={false} fontSize={10} width={25} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="customers" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Status & Top Products */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Pending", count: orderStatusCounts.pending, color: "bg-yellow-500", textColor: "text-yellow-600" },
                    { label: "Processing", count: orderStatusCounts.processing, color: "bg-blue-500", textColor: "text-blue-600" },
                    { label: "Shipped", count: orderStatusCounts.shipped, color: "bg-purple-500", textColor: "text-purple-600" },
                    { label: "Delivered", count: orderStatusCounts.delivered, color: "bg-emerald-500", textColor: "text-emerald-600" },
                    { label: "Cancelled", count: orderStatusCounts.cancelled, color: "bg-red-500", textColor: "text-red-600" },
                  ].map((status) => {
                    const total = stats?.orders || 1;
                    const percentage = Math.round((status.count / total) * 100) || 0;
                    return (
                      <div key={status.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{status.label}</span>
                          <span className={cn("font-bold", status.textColor)}>{status.count}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all", status.color)}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : topProducts && topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        index === 0 ? "bg-yellow-500/20 text-yellow-600" :
                        index === 1 ? "bg-gray-300/30 text-gray-600" :
                        index === 2 ? "bg-orange-500/20 text-orange-600" :
                        "bg-secondary text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.reviews_count || 0} reviews</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">Rs.{product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
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
