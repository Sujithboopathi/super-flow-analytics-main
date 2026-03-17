import { useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AppLayout from "@/components/AppLayout";
import { useSales, useAllSaleItems } from "@/hooks/useSales";
import { useProducts } from "@/hooks/useProducts";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(0, 72%, 45%)", "hsl(38, 85%, 55%)", "hsl(142, 76%, 36%)", "hsl(217, 91%, 60%)", "hsl(280, 67%, 54%)", "hsl(190, 80%, 45%)"];

export default function AnalyticsPage() {
  const { data: sales = [] } = useSales();
  const { data: saleItems = [] } = useAllSaleItems();
  const { data: products = [] } = useProducts();

  const dailyRevenue = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const daySales = sales.filter((s) => format(new Date(s.created_at), "yyyy-MM-dd") === dateStr);
      return {
        date: format(date, "MMM d"),
        revenue: daySales.reduce((sum, s) => sum + s.net_amount, 0),
        orders: daySales.length,
      };
    });
  }, [sales]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    saleItems.forEach((item) => {
      if (!map[item.product_id]) map[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 };
      map[item.product_id].qty += item.quantity;
      map[item.product_id].revenue += item.total_price;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [saleItems]);

  const paymentMethods = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => { map[s.payment_method] = (map[s.payment_method] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const categoryRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    saleItems.forEach((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const cat = product?.category || "Other";
      map[cat] = (map[cat] || 0) + item.total_price;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) })).sort((a, b) => b.value - a.value);
  }, [saleItems, products]);

  const totalRevenue = sales.reduce((s, sale) => s + sale.net_amount, 0);
  const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Analytics</h1>
          <p className="text-muted-foreground text-sm">Insights and trends from your sales data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">₹{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold mt-1">{sales.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Avg Order Value</p>
            <p className="text-2xl font-bold mt-1">₹{avgOrderValue.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border p-6">
            <h3 className="text-sm font-semibold mb-4">Revenue Trend (14 Days)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 90%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(215, 20%, 90%)" }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(0, 72%, 45%)" strokeWidth={2.5} dot={{ fill: "hsl(0, 72%, 45%)", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-6">
            <h3 className="text-sm font-semibold mb-4">Top Products by Revenue</h3>
            <div className="h-72">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 90%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <Tooltip contentStyle={{ borderRadius: "8px" }} />
                    <Bar dataKey="revenue" fill="hsl(38, 85%, 55%)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-20">No sales data yet</p>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border p-6">
            <h3 className="text-sm font-semibold mb-4">Revenue by Category</h3>
            <div className="h-72">
              {categoryRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryRevenue} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-20">No data</p>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border p-6">
            <h3 className="text-sm font-semibold mb-4">Payment Methods</h3>
            <div className="h-72">
              {paymentMethods.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-20">No data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
