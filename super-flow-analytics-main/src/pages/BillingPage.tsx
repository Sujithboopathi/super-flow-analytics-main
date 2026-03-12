import { useState } from "react";
import { Search, Plus, Trash2, ShoppingCart, CreditCard, Banknote, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useActiveProducts, type Product } from "@/hooks/useProducts";
import { useCreateSale } from "@/hooks/useSales";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function BillingPage() {
  const { data: products = [] } = useActiveProducts();
  const createSale = useCreateSale();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error("Not enough stock");
          return prev;
        }
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (product.stock_quantity <= 0) {
        toast.error("Out of stock");
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity: qty } : i));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const tax = subtotal * 0.18; // GST 18%
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    try {
      await createSale.mutateAsync({
        total_amount: subtotal,
        discount_amount: 0,
        tax_amount: tax,
        net_amount: total,
        payment_method: paymentMethod,
        customer_name: customerName || undefined,
        items: cart.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.price,
          total_price: i.product.price * i.quantity,
        })),
      });
      toast.success("Sale completed successfully!");
      setCart([]);
      setCustomerName("");
    } catch (e: any) {
      toast.error(e.message || "Failed to complete sale");
    }
  };

  return (
    <AppLayout>
      <div className="h-screen flex">
        {/* Products panel */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
            <p className="text-muted-foreground text-sm">Search or scan products to add to cart</p>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="text-left p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                    {product.barcode && (
                      <p className="text-[10px] font-mono text-muted-foreground mt-1">{product.barcode}</p>
                    )}
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex items-end justify-between mt-3">
                  <p className="text-lg font-bold text-primary">₹{product.price.toFixed(2)}</p>
                  <p className={`text-xs font-medium ${product.stock_quantity <= product.min_stock_level ? "text-warning" : "text-muted-foreground"}`}>
                    {product.stock_quantity} in stock
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart panel */}
        <div className="w-96 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Cart ({cart.length})</h2>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">Scan or click products to add</p>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.product.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="h-7 w-7 rounded-md bg-background border flex items-center justify-center text-sm font-medium hover:bg-muted">−</button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="h-7 w-7 rounded-md bg-background border flex items-center justify-center text-sm font-medium hover:bg-muted">+</button>
                  </div>
                  <p className="text-sm font-semibold w-16 text-right">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t space-y-3">
            <Input
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${paymentMethod === "cash" ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
              >
                <Banknote className="h-4 w-4" /> Cash
              </button>
                <button
                 onClick={() => setPaymentMethod("card")}
                 className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${paymentMethod === "card" ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
               >
                 <CreditCard className="h-4 w-4" /> Card
               </button>
               <button
                 onClick={() => setPaymentMethod("upi")}
                 className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${paymentMethod === "upi" ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
               >
                 📱 UPI
               </button>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>₹{tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span className="text-primary">₹{total.toFixed(2)}</span></div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0 || createSale.isPending}
              className="w-full h-12 text-base font-semibold"
            >
              {createSale.isPending ? "Processing..." : `Charge ₹${total.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
