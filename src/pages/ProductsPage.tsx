import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Package } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const defaultForm = { name: "", barcode: "", category: "General", price: 0, cost_price: 0, stock_quantity: 0, min_stock_level: 10, unit: "pcs" };

export default function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditId(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ name: p.name, barcode: p.barcode || "", category: p.category, price: p.price, cost_price: p.cost_price, stock_quantity: p.stock_quantity, min_stock_level: p.min_stock_level, unit: p.unit });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    try {
      if (editId) {
        await updateProduct.mutateAsync({ id: editId, ...form, barcode: form.barcode || null });
      } else {
        await createProduct.mutateAsync({ ...form, barcode: form.barcode || null });
      }
      toast.success(editId ? "Product updated" : "Product created");
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground text-sm">{products.length} products in inventory</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 max-w-md" />
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Product</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Barcode</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Category</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Price</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Cost</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Stock</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm font-mono text-muted-foreground">{p.barcode || "—"}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{p.category}</span></td>
                  <td className="p-3 text-sm font-semibold text-right">₹{p.price.toFixed(2)}</td>
                  <td className="p-3 text-sm text-muted-foreground text-right">₹{p.cost_price.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <span className={`text-sm font-semibold ${p.stock_quantity <= p.min_stock_level ? "text-warning" : ""}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-muted transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Product Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Barcode"><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Field>
              <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
              <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
              <Field label="Selling Price"><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
              <Field label="Cost Price"><Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} /></Field>
              <Field label="Stock Quantity"><Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} /></Field>
              <Field label="Min Stock Level"><Input type="number" value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: Number(e.target.value) })} /></Field>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
