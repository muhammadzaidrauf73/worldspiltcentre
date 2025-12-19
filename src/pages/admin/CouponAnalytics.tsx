import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay, isWithinInterval, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, Ticket, DollarSign, Users, ArrowUp, ArrowDown, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const CouponAnalytics = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Fetch coupon usage data
  const { data: usageData = [], isLoading: usageLoading } = useQuery({
    queryKey: ["coupon-usage-analytics", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupon_usage")
        .select("*, coupons(code, discount_type, discount_value)")
        .gte("used_at", startOfDay(dateRange.from).toISOString())
        .lte("used_at", dateRange.to.toISOString())
        .order("used_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch all coupons for comparison
  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("current_uses", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const totalRedemptions = usageData.length;
  const totalDiscountGiven = usageData.reduce((sum, u) => sum + Number(u.discount_amount || 0), 0);
  const totalOrderValue = usageData.reduce((sum, u) => sum + Number(u.order_total || 0), 0);
  const uniqueUsers = new Set(usageData.map(u => u.user_id)).size;
  const avgDiscountPerOrder = totalRedemptions > 0 ? totalDiscountGiven / totalRedemptions : 0;

  // Redemption trends by day
  const redemptionsByDay = usageData.reduce((acc: Record<string, number>, usage) => {
    const day = format(parseISO(usage.used_at), "MMM d");
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const trendData = Object.entries(redemptionsByDay)
    .map(([date, count]) => ({ date, redemptions: count }))
    .reverse();

  // Most used coupons
  const couponStats = usageData.reduce((acc: Record<string, { count: number; discount: number; code: string }>, usage: any) => {
    const code = usage.coupons?.code || "Unknown";
    if (!acc[code]) {
      acc[code] = { count: 0, discount: 0, code };
    }
    acc[code].count += 1;
    acc[code].discount += Number(usage.discount_amount || 0);
    return acc;
  }, {});

  const topCoupons = Object.values(couponStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Discount by type (pie chart data)
  const discountByType = usageData.reduce((acc: Record<string, number>, usage: any) => {
    const type = usage.coupons?.discount_type || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(discountByType).map(([name, value]) => ({
    name: name === "percentage" ? "Percentage" : "Fixed Amount",
    value,
  }));

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))"];

  const presetRanges = [
    { label: "7 Days", days: 7 },
    { label: "14 Days", days: 14 },
    { label: "30 Days", days: 30 },
    { label: "90 Days", days: 90 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Coupon Analytics</h1>
            <p className="text-muted-foreground">Track coupon performance and redemption trends</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {presetRanges.map((preset) => (
              <Button
                key={preset.days}
                variant={
                  Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) === preset.days
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setDateRange({ from: subDays(new Date(), preset.days), to: new Date() })}
              >
                {preset.label}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
              <Ticket className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalRedemptions}</div>
              <p className="text-xs text-muted-foreground">in selected period</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discount Given</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">Rs.{totalDiscountGiven.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">total savings for customers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">Rs.{totalOrderValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">orders with coupons</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">used coupons</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Discount</CardTitle>
              <Award className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-600">Rs.{Math.round(avgDiscountPerOrder).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">per order</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Redemption Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Redemption Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorRedemptions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="redemptions"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorRedemptions)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No redemption data for selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Coupons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Top Performing Coupons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCoupons.length > 0 ? (
                <div className="space-y-4">
                  {topCoupons.map((coupon, index) => (
                    <div key={coupon.code} className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        index === 0 && "bg-amber-500/20 text-amber-600",
                        index === 1 && "bg-gray-400/20 text-gray-600",
                        index === 2 && "bg-amber-700/20 text-amber-700",
                        index > 2 && "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">
                            {coupon.code}
                          </code>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Rs.{coupon.discount.toLocaleString()} saved
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{coupon.count}</p>
                        <p className="text-xs text-muted-foreground">uses</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No coupon usage data
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discount Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Discount Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Coupons Performance */}
        <Card>
          <CardHeader>
            <CardTitle>All Coupons Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coupon Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Total Uses</TableHead>
                  <TableHead>Usage Limit</TableHead>
                  <TableHead>Per User Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon: any) => {
                  const usageRate = coupon.max_uses 
                    ? Math.round((coupon.current_uses / coupon.max_uses) * 100) 
                    : null;
                  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                  const isUsedUp = coupon.max_uses && coupon.current_uses >= coupon.max_uses;
                  
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                          {coupon.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {coupon.discount_type === "percentage" 
                          ? `${coupon.discount_value}%` 
                          : `Rs.${coupon.discount_value}`
                        }
                      </TableCell>
                      <TableCell className="font-semibold">{coupon.current_uses || 0}</TableCell>
                      <TableCell>{coupon.max_uses || "Unlimited"}</TableCell>
                      <TableCell>{coupon.max_uses_per_user || "Unlimited"}</TableCell>
                      <TableCell>
                        {!coupon.is_active ? (
                          <Badge variant="secondary">Inactive</Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : isUsedUp ? (
                          <Badge variant="destructive">Used Up</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {usageRate !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  usageRate >= 90 ? "bg-destructive" : usageRate >= 50 ? "bg-amber-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${usageRate}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{usageRate}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CouponAnalytics;
