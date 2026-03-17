import { useState } from "react";
import { ShoppingCart, LogIn, UserPlus, Eye, EyeOff, Store, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import shoppingHero from "@/assets/shopping-hero.png";

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, fullName: string, asCustomer?: boolean) => Promise<void>;
}

export default function LoginPage({ onSignIn, onSignUp }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupMode, setSignupMode] = useState<"customer" | "staff">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Normalize email to lowercase
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`Auth Attempt: ${isSignUp ? 'SignUp' : 'SignIn'} for email: [${normalizedEmail}]`);
    
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        toast.info(`Creating account for: ${normalizedEmail}`);
        await onSignUp(normalizedEmail, password, fullName, signupMode === "customer");
        toast.success("Account created successfully!");
        // Clear password for safety after account creation
        setPassword("");
        setConfirmPassword("");
        setIsSignUp(false);
      } else {
        toast.info(`Signing in as: ${normalizedEmail}`);
        await onSignIn(normalizedEmail, password);
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={shoppingHero}
          alt="Supermarket shopping with fresh groceries"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-foreground/30" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-primary-foreground">
          <h2 className="text-4xl font-bold leading-tight mb-3">
            Smart Shopping,<br />Smarter Billing
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Browse products, build your cart, and place orders instantly. Your smart supermarket experience starts here.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-primary shadow-lg shadow-primary/30 mb-4">
              <ShoppingCart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">SmartBill</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Smart Supermarket Shopping System
            </p>
          </div>

          <div className="bg-card rounded-2xl border shadow-xl p-8">
            <h2 className="text-xl font-semibold mb-6">
              {isSignUp ? "Create Account" : "Sign In"}
            </h2>

            {/* Sign up mode selector */}
            {isSignUp && (
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setSignupMode("customer")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    signupMode === "customer"
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <User className="h-4 w-4" /> Customer
                </button>
                <button
                  type="button"
                  onClick={() => setSignupMode("staff")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    signupMode === "staff"
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <Store className="h-4 w-4" /> Staff
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5 animate-in fade-in duration-300">
                  <Label className="text-xs font-medium">Confirm Password</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                {loading ? (
                  "Please wait..."
                ) : isSignUp ? (
                  <><UserPlus className="h-4 w-4 mr-2" /> Create {signupMode === "customer" ? "Customer" : "Staff"} Account</>
                ) : (
                  <><LogIn className="h-4 w-4 mr-2" /> Sign In</>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline font-medium"
              >
                {isSignUp ? "Already have an account? Sign In" : "New here? Create Account"}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2026 SmartBill — Smart Supermarket System
          </p>
        </div>
      </div>
    </div>
  );
}
