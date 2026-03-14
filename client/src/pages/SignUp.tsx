import { useState } from "react";
import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ArrowLeft, ArrowRight, Loader2, CheckCircle, Building2, Stethoscope, Wrench, Scale, UtensilsCrossed, Scissors, Briefcase } from "lucide-react";

const businessTypes = [
  { value: "dental", label: "Dental", icon: Stethoscope },
  { value: "medical", label: "Medical", icon: Stethoscope },
  { value: "hvac", label: "HVAC", icon: Wrench },
  { value: "law", label: "Law Firm", icon: Scale },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "salon", label: "Salon / Spa", icon: Scissors },
  { value: "other", label: "Other", icon: Briefcase },
];

export default function SignUp() {
  const { signup } = useAuth();
  const [, setLocation] = useHashLocation();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");

  // Step 3 — result
  const [assignedNumber, setAssignedNumber] = useState("");

  const canProceedStep1 = email && password && confirmPassword && password === confirmPassword;
  const canProceedStep2 = businessName && businessType;

  const handleStep1Next = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 3) {
      setError("Password must be at least 3 characters");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleStep2Submit = async () => {
    setError("");
    setLoading(true);
    try {
      await signup({ email, password, businessName, businessType, phone: phone || undefined });
      // After signup, auth context has the tenant with assignedNumber
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(var(--background))" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Phone size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg" style={{ color: "hsl(var(--foreground))" }}>NovaCaller</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step >= s ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: step >= s ? "white" : "hsl(var(--muted-foreground))",
                }}
              >
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
              {s < 3 && (
                <div className="w-8 h-0.5 rounded" style={{ background: step > s ? "hsl(var(--primary))" : "hsl(var(--muted))" }} />
              )}
            </div>
          ))}
        </div>

        <Card style={{ borderColor: "hsl(var(--border))" }}>
          <CardContent className="p-6">
            {/* ── Step 1: Account ─────────────────────────────────────────── */}
            {step === 1 && (
              <>
                <h1 className="text-lg font-bold mb-1 text-center" style={{ color: "hsl(var(--foreground))" }}>
                  Create your account
                </h1>
                <p className="text-sm text-center mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Step 1 of 3 — Account details
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Email</label>
                    <Input
                      data-testid="signup-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Password</label>
                    <Input
                      data-testid="signup-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Confirm Password</label>
                    <Input
                      data-testid="signup-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="text-sm"
                    />
                  </div>

                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button
                    data-testid="signup-step1-next"
                    disabled={!canProceedStep1}
                    onClick={handleStep1Next}
                    className="w-full text-sm font-semibold"
                    style={{ background: "hsl(var(--primary))", color: "white" }}
                  >
                    Continue
                    <ArrowRight size={14} className="ml-2" />
                  </Button>
                </div>
              </>
            )}

            {/* ── Step 2: Business Info ──────────────────────────────────── */}
            {step === 2 && (
              <>
                <h1 className="text-lg font-bold mb-1 text-center" style={{ color: "hsl(var(--foreground))" }}>
                  Tell us about your business
                </h1>
                <p className="text-sm text-center mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Step 2 of 3 — Business details
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Business Name</label>
                    <Input
                      data-testid="signup-business-name"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Sunrise Dental"
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Business Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {businessTypes.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          data-testid={`signup-type-${value}`}
                          onClick={() => setBusinessType(value)}
                          className="flex items-center gap-2 p-2.5 rounded-lg text-sm text-left transition-all"
                          style={{
                            border: businessType === value
                              ? "2px solid hsl(var(--primary))"
                              : "1px solid hsl(var(--border))",
                            background: businessType === value ? "hsl(var(--primary) / 0.05)" : "transparent",
                            color: "hsl(var(--foreground))",
                          }}
                        >
                          <Icon size={14} style={{ color: businessType === value ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Business Phone <span className="font-normal">(optional)</span>
                    </label>
                    <Input
                      data-testid="signup-phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="text-sm"
                    />
                  </div>

                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setStep(1); setError(""); }} className="text-sm">
                      <ArrowLeft size={14} className="mr-1" />
                      Back
                    </Button>
                    <Button
                      data-testid="signup-step2-submit"
                      disabled={!canProceedStep2 || loading}
                      onClick={handleStep2Submit}
                      className="flex-1 text-sm font-semibold"
                      style={{ background: "hsl(var(--primary))", color: "white" }}
                    >
                      {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
                      {loading ? "Setting up..." : "Create My AI Receptionist"}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 3: Success ────────────────────────────────────────── */}
            {step === 3 && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "hsl(var(--primary) / 0.1)" }}>
                  <CheckCircle size={28} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <h1 className="text-lg font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
                  You're all set!
                </h1>
                <p className="text-sm mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Your AI receptionist is ready. We've auto-generated intake fields, FAQs, and escalation rules for your business.
                </p>

                <Card className="mb-6 text-left" style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }}>
                  <CardContent className="p-4">
                    <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Your AI Phone Number
                    </div>
                    <div className="text-lg font-bold flex items-center gap-2" style={{ color: "hsl(var(--primary))" }}>
                      <Phone size={16} />
                      Number assigned on dashboard
                    </div>
                    <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Forward your business line to this number, or use it directly.
                    </p>
                  </CardContent>
                </Card>

                <Button
                  data-testid="signup-go-dashboard"
                  onClick={() => setLocation("/dashboard")}
                  className="w-full text-sm font-semibold"
                  style={{ background: "hsl(var(--primary))", color: "white" }}
                >
                  Go to Dashboard
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {step < 3 && (
          <div className="mt-4 text-center text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "hsl(var(--primary))" }}>
              Sign in
            </Link>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs flex items-center justify-center gap-1 hover:underline" style={{ color: "hsl(var(--muted-foreground))" }}>
            <ArrowLeft size={12} />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
