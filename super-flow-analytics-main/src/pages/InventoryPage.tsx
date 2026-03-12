import { AlertTriangle, Package, ArrowUpDown } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useProducts } from "@/hooks/useProducts";
import { useState } from "react";

export default function InventoryPage() {
  const { data: products = [] } = useProducts();
  const [sortBy, setSortBy] = useState<"stock" | "name">("stock");

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "stock") return a.stock_quantity - b.stock_quantity;
    return a.name.localeCompare(b.name);
  });

  const lowStock = products.filter((p) => p.stock_quantity <= p.min_stock_level);
  const outOfStock = products.filter((p) => p.stock_quantity === 0);
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock_quantity, 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground text-sm">Monitor stock levels and alerts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold mt-1">{products.length}</p>
          </div>
          <div className="stat-card border-warning/20 bg-warning/5">
            <p className="text-sm text-muted-foreground">Low Stock</p>
            <p className="text-2xl font-bold mt-1 text-warning">{lowStock.length}</p>
          </div>
          <div className="stat-card border-destructive/20 bg-destructive/5">
            <p className="text-sm text-muted-foreground">Out of Stock</p>
            <p className="text-2xl font-bold mt-1 text-destructive">{outOfStock.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Inventory Value</p>
            <p className="text-2xl font-bold mt-1">₹{totalValue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold">Stock Levels</h3>
            <button onClick={() => setSortBy(sortBy === "stock" ? "name" : "stock")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowUpDown className="h-3 w-3" /> Sort by {sortBy === "stock" ? "name" : "stock"}
            </button>
          </div>
          <div className="divide-y">
            {sorted.map((p) => {
              const ratio = p.min_stock_level > 0 ? p.stock_quantity / p.min_stock_level : 1;
              const isLow = p.stock_quantity <= p.min_stock_level;
              const isOut = p.stock_quantity === 0;
              return (
                <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isOut ? "bg-destructive/10" : isLow ? "bg-warning/10" : "bg-primary/10"}`}>
                    {isOut || isLow ? <AlertTriangle className={`h-4 w-4 ${isOut ? "text-destructive" : "text-warning"}`} /> : <Package className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category} · {p.unit}</p>
                  </div>
                  <div className="w-48">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{p.stock_quantity} / {p.min_stock_level * 3} capacity</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOut ? "bg-destructive" : isLow ? "bg-warning" : "bg-primary"}`}
                        style={{ width: `${Math.min(100, (p.stock_quantity / (p.min_stock_level * 3)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <p className={`text-sm font-bold ${isOut ? "text-destructive" : isLow ? "text-warning" : ""}`}>{p.stock_quantity}</p>
                    <p className="text-[10px] text-muted-foreground">min: {p.min_stock_level}</p>
                  </div>
                  {isLow && !isOut && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">LOW</span>}
                  {isOut && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">OUT</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
