import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, ShoppingCart, Users, TrendingUp, DollarSign, CalendarIcon, 
  ArrowUpRight, ArrowDownRight, Heart, Eye, Activity, Zap, Target,
  Clock, Star, TrendingDown, ShoppingBag, Sparkles, Crown, UserCheck,
  Repeat, Award, Gem, Bell, Send, Loader2, Mail
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, isWithinInterval, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sendingVipAlerts, setSendingVipAlerts] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSendVipAlerts = async () => {
    setSendingVipAlerts(true);
    try {
      const { data, error } = await supabase.functions.invoke("vip-customer-alerts", {
        body: { inactiveDays: 30, vipThreshold: 50000 },
      });

      if (error) throw error;

      if (data.inactiveCount === 0) {
        toast.info("No inactive VIP customers found", {
          description: "All VIP customers have ordered within the last 30 days.",
        });
      } else {
        toast.success(`VIP Alert sent successfully!`, {
          description: `Found ${data.inactiveCount} inactive VIP customer${data.inactiveCount > 1 ? "s" : ""}. Email sent to ${data.emailSentTo}`,
        });
      }
    } catch (error: any) {
      console.error("Error sending VIP alerts:", error);
      toast.error("Failed to send VIP alerts", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setSendingVipAlerts(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
    if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
    if (hour < 21) return { text: "Good Evening", emoji: "🌅" };
    return { text: "Good Night", emoji: "🌙" };
  };

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

      // Calculate average order value
      const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

      return {
        products: productsRes.count || 0,
        categories: categoriesRes.count || 0,
        orders: filteredOrders.length,
        pendingOrders,
        completedOrders,
        totalRevenue,
        avgOrderValue,
        customers: filteredCustomers.length,
        allCustomers: customersRes.data?.length || 0,
        ordersData: filteredOrders,
        customersData: filteredCustomers,
      };
    },
  });

  // Wishlist insights
  const { data: wishlistStats } = useQuery({
    queryKey: ["admin-wishlist-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("product_id, created_at");
      
      if (error) throw error;
      
      const uniqueProducts = new Set(data?.map(item => item.product_id)).size;
      const totalItems = data?.length || 0;
      const recentItems = data?.filter(item => 
        differenceInHours(new Date(), new Date(item.created_at)) <= 24
      ).length || 0;

      return { uniqueProducts, totalItems, recentItems };
    },
  });

  // Category performance
  const { data: categoryPerformance } = useQuery({
    queryKey: ["admin-category-performance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, product_count")
        .order("product_count", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  // Recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const [ordersRes, reviewsRes, messagesRes] = await Promise.all([
        supabase.from("orders").select("id, customer_name, total, created_at, status").order("created_at", { ascending: false }).limit(5),
        supabase.from("product_reviews").select("id, reviewer_name, rating, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("contact_messages").select("id, name, created_at").order("created_at", { ascending: false }).limit(3),
      ]);

      const activities: Array<{
        id: string;
        type: "order" | "review" | "message";
        title: string;
        subtitle: string;
        time: Date;
        icon: "cart" | "star" | "message";
        color: string;
      }> = [];

      ordersRes.data?.forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          type: "order",
          title: `New order from ${order.customer_name || "Guest"}`,
          subtitle: `Rs.${Number(order.total).toLocaleString()}`,
          time: new Date(order.created_at),
          icon: "cart",
          color: "text-emerald-500",
        });
      });

      reviewsRes.data?.forEach(review => {
        activities.push({
          id: `review-${review.id}`,
          type: "review",
          title: `${review.reviewer_name || "Customer"} left a review`,
          subtitle: `${review.rating} stars`,
          time: new Date(review.created_at),
          icon: "star",
          color: "text-yellow-500",
        });
      });

      messagesRes.data?.forEach(msg => {
        activities.push({
          id: `msg-${msg.id}`,
          type: "message",
          title: `Message from ${msg.name}`,
          subtitle: "New inquiry",
          time: new Date(msg.created_at),
          icon: "message",
          color: "text-blue-500",
        });
      });

      return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8);
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ["admin-top-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, reviews_count, image_url")
        .order("reviews_count", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // Low stock products
  const { data: lowStockProducts } = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity, image_url")
        .lt("stock_quantity", 10)
        .gt("stock_quantity", 0)
        .order("stock_quantity", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // Customer Lifetime Value (CLV) Analysis
  const { data: clvData, isLoading: clvLoading } = useQuery({
    queryKey: ["admin-clv-analysis"],
    queryFn: async () => {
      const { data: allOrders, error } = await supabase
        .from("orders")
        .select("id, user_id, customer_name, customer_email, total, created_at, status")
        .not("user_id", "is", null);

      if (error) throw error;

      // Group orders by user
      const customerOrders: Record<string, {
        userId: string;
        name: string;
        email: string;
        orders: number;
        totalSpent: number;
        firstOrder: Date;
        lastOrder: Date;
        avgOrderValue: number;
      }> = {};

      allOrders?.forEach(order => {
        if (!order.user_id) return;
        
        if (!customerOrders[order.user_id]) {
          customerOrders[order.user_id] = {
            userId: order.user_id,
            name: order.customer_name || "Customer",
            email: order.customer_email || "",
            orders: 0,
            totalSpent: 0,
            firstOrder: new Date(order.created_at),
            lastOrder: new Date(order.created_at),
            avgOrderValue: 0,
          };
        }

        const customer = customerOrders[order.user_id];
        customer.orders += 1;
        customer.totalSpent += Number(order.total);
        
        const orderDate = new Date(order.created_at);
        if (orderDate < customer.firstOrder) customer.firstOrder = orderDate;
        if (orderDate > customer.lastOrder) customer.lastOrder = orderDate;
      });

      // Calculate average order value for each customer
      Object.values(customerOrders).forEach(customer => {
        customer.avgOrderValue = customer.totalSpent / customer.orders;
      });

      const customers = Object.values(customerOrders);
      
      // Calculate metrics
      const totalCustomers = customers.length;
      const repeatCustomers = customers.filter(c => c.orders > 1);
      const repeatRate = totalCustomers > 0 ? (repeatCustomers.length / totalCustomers) * 100 : 0;
      
      const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
      const avgCLV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
      
      const avgOrdersPerCustomer = totalCustomers > 0 
        ? customers.reduce((sum, c) => sum + c.orders, 0) / totalCustomers 
        : 0;

      // Top customers by value
      const topCustomers = [...customers]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      // Most loyal (most orders)
      const mostLoyal = [...customers]
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      // Customer segments
      const segments = {
        vip: customers.filter(c => c.totalSpent >= 50000).length,
        regular: customers.filter(c => c.totalSpent >= 10000 && c.totalSpent < 50000).length,
        occasional: customers.filter(c => c.totalSpent >= 1000 && c.totalSpent < 10000).length,
        new: customers.filter(c => c.totalSpent < 1000).length,
      };

      return {
        totalCustomers,
        repeatCustomers: repeatCustomers.length,
        repeatRate,
        avgCLV,
        avgOrdersPerCustomer,
        topCustomers,
        mostLoyal,
        segments,
        totalRevenue,
      };
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

  const pieData = [
    { name: "Pending", value: orderStatusCounts.pending, color: "#eab308" },
    { name: "Processing", value: orderStatusCounts.processing, color: "#3b82f6" },
    { name: "Shipped", value: orderStatusCounts.shipped, color: "#8b5cf6" },
    { name: "Delivered", value: orderStatusCounts.delivered, color: "#10b981" },
    { name: "Cancelled", value: orderStatusCounts.cancelled, color: "#ef4444" },
  ].filter(item => item.value > 0);

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

  const formatTimeAgo = (date: Date) => {
    const hours = differenceInHours(new Date(), date);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const greeting = getGreeting();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Greeting */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{greeting.emoji}</span>
              <h1 className="text-3xl font-bold text-foreground">{greeting.text}</h1>
            </div>
            <p className="text-muted-foreground">
              Here's what's happening with your store today
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
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

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
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
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">
                      {stats?.completedOrders || 0} completed
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
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
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">
                      {stats?.pendingOrders || 0} pending
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
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
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-violet-500" />
                    <span className="text-xs text-muted-foreground">
                      {stats?.allCustomers || 0} total
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Target className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600">
                    Rs.{Math.round(stats?.avgOrderValue || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Package className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-muted-foreground">
                      {stats?.products || 0} products
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insight Cards Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Wishlist Activity
                </CardTitle>
                <Badge variant="secondary" className="bg-pink-500/10 text-pink-600 border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Insights
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-pink-600">{wishlistStats?.totalItems || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-600">{wishlistStats?.uniqueProducts || 0}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-600">{wishlistStats?.recentItems || 0}</p>
                  <p className="text-xs text-muted-foreground">Last 24h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-500" />
                  Conversion Rate
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-cyan-600">
                    {stats?.allCustomers && stats?.orders 
                      ? Math.round((stats.orders / stats.allCustomers) * 100) 
                      : 0}%
                  </span>
                  <span className="text-xs text-muted-foreground">Orders / Customers</span>
                </div>
                <Progress 
                  value={stats?.allCustomers && stats?.orders 
                    ? (stats.orders / stats.allCustomers) * 100 
                    : 0} 
                  className="h-2 bg-cyan-500/20"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                  Low Stock Alert
                </CardTitle>
                {lowStockProducts && lowStockProducts.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {lowStockProducts.length} items
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {lowStockProducts && lowStockProducts.length > 0 ? (
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 3).map(product => (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{product.name}</span>
                      <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                        {product.stock_quantity} left
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All products are well stocked!
                </p>
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

        {/* Three Column Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Order Status with Pie Chart */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : pieData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-[120px] h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {pieData.map((status) => (
                      <div key={status.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                          <span className="text-muted-foreground">{status.name}</span>
                        </div>
                        <span className="font-medium">{status.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  No orders yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Activity Feed */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Live Activity
                </CardTitle>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className={cn("mt-0.5", activity.color)}>
                        {activity.icon === "cart" && <ShoppingBag className="h-4 w-4" />}
                        {activity.icon === "star" && <Star className="h-4 w-4" />}
                        {activity.icon === "message" && <Eye className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(activity.time)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryPerformance && categoryPerformance.length > 0 ? (
                <div className="space-y-3">
                  {categoryPerformance.map((category, index) => {
                    const maxCount = categoryPerformance[0]?.product_count || 1;
                    const percentage = ((category.product_count || 0) / maxCount) * 100;
                    return (
                      <div key={category.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate">{category.name}</span>
                          <span className="text-muted-foreground">{category.product_count || 0}</span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className={cn(
                            "h-1.5",
                            index === 0 && "[&>div]:bg-emerald-500",
                            index === 1 && "[&>div]:bg-blue-500",
                            index === 2 && "[&>div]:bg-violet-500",
                            index === 3 && "[&>div]:bg-orange-500",
                            index === 4 && "[&>div]:bg-pink-500"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  No categories yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Top Products by Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : topProducts && topProducts.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-all">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                      index === 0 ? "bg-yellow-500/20 text-yellow-600" :
                      index === 1 ? "bg-gray-300/30 text-gray-600" :
                      index === 2 ? "bg-orange-500/20 text-orange-600" :
                      "bg-secondary text-muted-foreground"
                    )}>
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">{product.reviews_count || 0} reviews</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">Rs.{product.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                No products yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Lifetime Value Analysis */}
        <Card className="border-2 border-gradient-to-r from-purple-500/20 to-pink-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Gem className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Customer Lifetime Value</CardTitle>
                  <p className="text-xs text-muted-foreground">Insights into customer spending patterns</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendVipAlerts}
                  disabled={sendingVipAlerts}
                  className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                >
                  {sendingVipAlerts ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  {sendingVipAlerts ? "Sending..." : "VIP Alerts"}
                </Button>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Analytics
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {clvLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : clvData ? (
              <>
                {/* CLV Stats Row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-purple-500" />
                      <span className="text-xs text-muted-foreground">Avg. CLV</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      Rs.{Math.round(clvData.avgCLV).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">per customer</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat className="h-4 w-4 text-pink-500" />
                      <span className="text-xs text-muted-foreground">Repeat Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-pink-600">
                      {clvData.repeatRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {clvData.repeatCustomers} of {clvData.totalCustomers} customers
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="h-4 w-4 text-cyan-500" />
                      <span className="text-xs text-muted-foreground">Avg. Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-cyan-600">
                      {clvData.avgOrdersPerCustomer.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">per customer</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Total Customers</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {clvData.totalCustomers}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">with orders</p>
                  </div>
                </div>

                {/* Customer Segments */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="p-4 rounded-xl border bg-card">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Customer Segments
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" />
                          <span className="text-sm">VIP (Rs.50,000+)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-0">
                            {clvData.segments.vip}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-violet-500" />
                          <span className="text-sm">Regular (Rs.10k-50k)</span>
                        </div>
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-0">
                          {clvData.segments.regular}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500" />
                          <span className="text-sm">Occasional (Rs.1k-10k)</span>
                        </div>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-0">
                          {clvData.segments.occasional}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-400 to-slate-500" />
                          <span className="text-sm">New (&lt;Rs.1,000)</span>
                        </div>
                        <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 border-0">
                          {clvData.segments.new}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Segment Progress Bars */}
                    <div className="mt-4 h-3 rounded-full overflow-hidden flex bg-secondary">
                      {clvData.totalCustomers > 0 && (
                        <>
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all" 
                            style={{ width: `${(clvData.segments.vip / clvData.totalCustomers) * 100}%` }}
                          />
                          <div 
                            className="h-full bg-gradient-to-r from-purple-400 to-violet-500 transition-all" 
                            style={{ width: `${(clvData.segments.regular / clvData.totalCustomers) * 100}%` }}
                          />
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 transition-all" 
                            style={{ width: `${(clvData.segments.occasional / clvData.totalCustomers) * 100}%` }}
                          />
                          <div 
                            className="h-full bg-gradient-to-r from-gray-400 to-slate-500 transition-all" 
                            style={{ width: `${(clvData.segments.new / clvData.totalCustomers) * 100}%` }}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Top Customers by Value */}
                  <div className="p-4 rounded-xl border bg-card">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-500" />
                      Top Customers by Value
                    </h4>
                    {clvData.topCustomers.length > 0 ? (
                      <div className="space-y-2">
                        {clvData.topCustomers.map((customer, index) => (
                          <div key={customer.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                              index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white" :
                              index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700" :
                              index === 2 ? "bg-gradient-to-br from-orange-400 to-amber-600 text-white" :
                              "bg-secondary text-muted-foreground"
                            )}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{customer.name}</p>
                              <p className="text-xs text-muted-foreground">{customer.orders} orders</p>
                            </div>
                            <p className="text-sm font-bold text-emerald-600">
                              Rs.{customer.totalSpent.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No customer data yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Most Loyal Customers */}
                <div className="p-4 rounded-xl border bg-card">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    Most Loyal Customers (by order frequency)
                  </h4>
                  {clvData.mostLoyal.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {clvData.mostLoyal.map((customer, index) => (
                        <div key={customer.userId} className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-br from-pink-500/5 to-transparent hover:shadow-md transition-all">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                            index === 0 ? "bg-pink-500 text-white" : "bg-pink-500/20 text-pink-600"
                          )}>
                            <Heart className={cn("h-4 w-4", index === 0 && "fill-current")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{customer.name}</p>
                            <div className="flex items-center gap-1">
                              <Repeat className="h-3 w-3 text-pink-500" />
                              <span className="text-xs text-pink-600 font-semibold">{customer.orders} orders</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No customer data yet
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
