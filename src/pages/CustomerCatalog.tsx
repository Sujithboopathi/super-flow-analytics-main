import { useState } from "react";
import { Search, Plus, Minus, ShoppingCart, X, User, Phone, IndianRupee, CheckCircle, Package } from "lucide-react";
import { useActiveProducts, type Product } from "@/hooks/useProducts";
import { useCreateOrder, useCustomerOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CustomerCatalog() {
  const { data: products = [] } = useActiveProducts();
  const { user, profile, signOut } = useAuth();
  const createOrder = useCreateOrder();
  const { data: myOrders = [] } = useCustomerOrders(user?.id);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState(profile?.full_name || "");
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || "");
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);
  const [showOrders, setShowOrders] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = products.filter(
    (p) =>
      (selectedCategory === "All" || p.category === selectedCategory) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search)))
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error("Sorry, not enough stock available");
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (product.stock_quantity <= 0) {
        toast.error("This item is out of stock");
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || undefined,
        total_amount: subtotal,
        tax_amount: tax,
        net_amount: total,
        items: cart.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.price,
          total_price: i.product.price * i.quantity,
        })),
      });
      setOrderPlaced(order.id);
      setCart([]);
      setShowCart(false);
      toast.success("Order placed! Staff has been notified.");
    } catch (e: any) {
      toast.error(e.message || "Failed to place order");
    }
  };

  // Order confirmation view
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Order Placed Successfully!</h1>
          <p className="text-muted-foreground">
            Your order has been sent to our staff. They will prepare your items shortly.
          </p>
          <div className="bg-card rounded-xl border p-4 text-left space-y-2">
            <p className="text-sm text-muted-foreground">Order Total</p>
            <p className="text-2xl font-bold text-primary">₹{total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">GST included</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setOrderPlaced(null)} className="flex-1">
              Continue Shopping
            </Button>
            <Button variant="outline" onClick={() => { setOrderPlaced(null); setShowOrders(true); }}>
              My Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // My orders view
  if (showOrders) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-card border-b px-4 py-3 flex items-center justify-between">
          <button onClick={() => setShowOrders(false)} className="text-sm text-primary font-medium">
            ← Back to Shop
          </button>
          <h1 className="font-semibold">My Orders</h1>
          <div />
        </header>
        <div className="max-w-2xl mx-auto p-4 space-y-3">
          {myOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No orders yet</p>
          ) : (
            myOrders.map((order) => (
              <div key={order.id} className="bg-card rounded-xl border p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "MMM d, yyyy • h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">₹{Number(order.net_amount).toFixed(2)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      order.status === "pending" ? "bg-warning/10 text-warning" :
                      order.status === "confirmed" ? "bg-info/10 text-info" :
                      order.status === "completed" ? "bg-success/10 text-success" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SmartBill</h1>
              <p className="text-[10px] text-muted-foreground">Welcome, {profile?.full_name || "Customer"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowOrders(true)}>
              <Package className="h-4 w-4 mr-1" /> My Orders
            </Button>
            <button
              onClick={() => setShowCart(true)}
              className="relative h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-primary" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Search + Categories */}
      <div className="max-w-7xl mx-auto px-4 pt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((product) => {
            const inCart = cart.find((i) => i.product.id === product.id);
            return (
              <div
                key={product.id}
                className="bg-card rounded-xl border p-4 hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.unit}</p>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-lg font-bold text-primary">₹{product.price.toFixed(2)}</p>
                  {product.stock_quantity <= 0 ? (
                    <span className="text-[10px] font-medium text-destructive">Out of stock</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{product.stock_quantity} left</span>
                  )}
                </div>
                <div className="mt-2">
                  {inCart ? (
                    <div className="flex items-center justify-between bg-primary/5 rounded-lg p-1">
                      <button
                        onClick={() => updateQty(product.id, inCart.quantity - 1)}
                        className="h-8 w-8 rounded-md bg-background border flex items-center justify-center hover:bg-muted"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-semibold">{inCart.quantity}</span>
                      <button
                        onClick={() => updateQty(product.id, inCart.quantity + 1)}
                        className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity <= 0}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add to Cart
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">No products found</p>
        )}
      </div>

      {/* Cart bottom bar */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{cartCount} items in cart</p>
              <p className="text-lg font-bold text-primary">₹{total.toFixed(2)}</p>
            </div>
            <Button onClick={() => setShowCart(true)}>
              View Cart & Checkout
            </Button>
          </div>
        </div>
      )}

      {/* Cart Slide-over */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setShowCart(false)} />
          <div className="ml-auto relative w-full max-w-md bg-card h-full flex flex-col shadow-xl animate-in slide-in-from-right">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Your Cart
              </h2>
              <button onClick={() => setShowCart(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-2">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16">Your cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">₹{item.product.price.toFixed(2)} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="h-7 w-7 rounded-md bg-background border flex items-center justify-center text-sm hover:bg-muted">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="h-7 w-7 rounded-md bg-background border flex items-center justify-center text-sm hover:bg-muted">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold w-16 text-right">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t space-y-3">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Your Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Phone Number (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || createOrder.isPending}
                className="w-full h-12 text-base font-semibold"
              >
                {createOrder.isPending ? "Placing Order..." : `Place Order • ₹${total.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
