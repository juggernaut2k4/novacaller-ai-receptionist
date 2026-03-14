import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ArrowLeft, Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useHashLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(var(--background))" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Phone size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg" style={{ color: "hsl(var(--foreground))" }}>NovaCaller</span>
        </div>

        <Card style={{ borderColor: "hsl(var(--border))" }}>
          <CardContent className="p-6">
            <h1 className="text-lg font-bold mb-1 text-center" style={{ color: "hsl(var(--foreground))" }}>
              Welcome back
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
              Sign in to your NovaCaller dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Email
                </label>
                <Input
                  data-testid="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Password
                </label>
                <Input
                  data-testid="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="text-sm"
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              <Button
                data-testid="login-submit"
                type="submit"
                disabled={loading}
                className="w-full text-sm font-semibold"
                style={{ background: "hsl(var(--primary))", color: "white" }}
              >
                {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold hover:underline" style={{ color: "hsl(var(--primary))" }}>
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs flex items-center justify-center gap-1 hover:underline" style={{ color: "hsl(var(--muted-foreground))" }}>
            <ArrowLeft size={12} />
            Back to home
          </Link>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-6 p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted))" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "hsl(var(--foreground))" }}>Demo Credentials</p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            demo@novacaller.com / demo123
          </p>
        </div>
      </div>
    </div>
  );
}
