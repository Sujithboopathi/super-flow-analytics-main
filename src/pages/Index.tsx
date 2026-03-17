import { IndianRupee, ShoppingCart, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import { useSales, useAllSaleItems } from "@/hooks/useSales";
import { useProducts } from "@/hooks/useProducts";
import { format, subDays, isAfter } from "date-fns";
import { useMemo } from "react";

const CHART_COLORS = [
  "hsl(0, 72%, 45%)",
  "hsl(38, 85%, 55%)",
  "hsl(142, 76%, 36%)",
  "hsl(217, 91%, 60%)",
  "hsl(280, 67%, 54%)",
];

export default function Dashboard() {
  const { data: sales = [] } = useSales();
  const { data: products = [] } = useProducts();
  const { data: saleItems = [] } = useAllSaleItems();

  const stats = useMemo(() => {
    const today = new Date();
    const todaySales = sales.filter((s) => format(new Date(s.created_at), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"));
    const totalRevenue = sales.reduce((sum, s) => sum + s.net_amount, 0);
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.net_amount, 0);
    const lowStock = products.filter((p) => p.stock_quantity <= p.min_stock_level);

    return { totalRevenue, todayRevenue, totalSales: sales.length, todaySales: todaySales.length, lowStock: lowStock.length, totalProducts: products.length };
  }, [sales, products]);

  const dailySalesData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const daySales = sales.filter((s) => format(new Date(s.created_at), "yyyy-MM-dd") === dateStr);
      return {
        date: format(date, "EEE"),
        revenue: daySales.reduce((sum, s) => sum + s.net_amount, 0),
        orders: daySales.length,
      };
    });
    return last7;
  }, [sales]);

  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    saleItems.forEach((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const cat = product?.category || "Other";
      catMap[cat] = (catMap[cat] || 0) + item.total_price;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [saleItems, products]);

  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.min_stock_level).slice(0, 5);
  const recentSales = sales.slice(0, 5);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your supermarket operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Today's Revenue" value={`₹${stats.todayRevenue.toFixed(2)}`} subtitle={`${stats.todaySales} transactions`} icon={IndianRupee} variant="primary" />
          <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toFixed(2)}`} subtitle={`${stats.totalSales} total sales`} icon={TrendingUp} variant="success" />
          <StatCard title="Products" value={stats.totalProducts} subtitle={`${products.filter((p) => p.is_active).length} active`} icon={Package} />
          <StatCard title="Low Stock Alerts" value={stats.lowStock} subtitle="Items below minimum" icon={AlertTriangle} variant="warning" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-card rounded-xl border p-6">
            <h3 className="text-sm font-semibold mb-4">Revenue — Last 7 Days</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 90%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(215, 20%, 90%)" }} />
                  <Bar dataKey="revenue" fill="hsl(0, 72%, 45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-6">
            <h3 className="text-sm font-semibold mb-4">Sales by Category</h3>
            {categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16">No sales data yet</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border p-6">
            <h3 className="text-sm font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentSales.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
              ) : (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium font-mono">{sale.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(sale.created_at), "MMM d, h:mm a")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹{sale.net_amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{sale.payment_method}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Low Stock Items
            </h3>
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">All products well stocked!</p>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-warning">{p.stock_quantity} left</p>
                      <p className="text-xs text-muted-foreground">Min: {p.min_stock_level}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
