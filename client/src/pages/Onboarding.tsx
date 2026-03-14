import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useHashLocation } from "wouter/use-hash-location";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Sparkles, CheckCircle, ChevronRight, Phone } from "lucide-react";

const BUSINESS_TYPES = [
  { value: "dental", label: "Dental Practice", emoji: "🦷" },
  { value: "hvac", label: "HVAC / Plumbing", emoji: "🔧" },
  { value: "law", label: "Law Firm", emoji: "⚖️" },
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "salon", label: "Salon / Spa", emoji: "💇" },
  { value: "medical", label: "Medical Clinic", emoji: "🏥" },
  { value: "realestate", label: "Real Estate", emoji: "🏠" },
  { value: "other", label: "Other Business", emoji: "🏢" },
];

type GeneratedSchema = {
  greeting: string;
  persona: string;
  fields: any[];
  faqs: any[];
};

export default function Onboarding() {
  const [, navigate] = useHashLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [schema, setSchema] = useState<GeneratedSchema | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Step 1: Create tenant
  const createTenantMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/tenants", {
      name: businessName,
      businessType,
      phone: phone || null,
      status: "onboarding",
      plan: "starter",
    }),
    onSuccess: async (tenant: any) => {
      setTenantId(tenant.id);
      // Generate schema
      const gen = await apiRequest("POST", `/api/tenants/${tenant.id}/generate-schema`, {
        businessName,
        businessType,
        businessDescription: description,
      });
      setSchema(gen);
      // Save greeting & persona
      await apiRequest("PATCH", `/api/tenants/${tenant.id}`, {
        greeting: gen.greeting,
        aiPersona: gen.persona,
      });
      // Save intake fields
      for (const f of gen.fields) {
        await apiRequest("POST", `/api/tenants/${tenant.id}/intake-fields`, f);
      }
      // Save FAQs
      for (const faq of gen.faqs) {
        await apiRequest("POST", `/api/tenants/${tenant.id}/faqs`, faq);
      }
      // Mark active
      await apiRequest("PATCH", `/api/tenants/${tenant.id}`, {
        status: "active",
        assignedNumber: "+1888" + String(Math.floor(Math.random() * 9000000 + 1000000)),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setStep(3);
    },
    onError: () => toast({ title: "Error", description: "Something went wrong.", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "hsl(var(--background))" }}>
      <div className="w-full max-w-xl">

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors`}
                style={{
                  background: step >= s ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: step >= s ? "white" : "hsl(var(--muted-foreground))",
                }}>
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
              {s < 3 && <div className="flex-1 h-px w-12" style={{ background: step > s ? "hsl(var(--primary))" : "hsl(var(--border))" }} />}
            </div>
          ))}
          <div className="ml-3 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {step === 1 && "Business Info"}{step === 2 && "Confirm"}{step === 3 && "Done!"}
          </div>
        </div>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <Card style={{ borderColor: "hsl(var(--border))" }}>
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold mb-1">Set up your AI receptionist</h2>
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Tell us about your business and we'll configure everything automatically.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Business Name *
                </label>
                <Input
                  data-testid="input-business-name"
                  placeholder="e.g. Sunrise Dental"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Business Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map(bt => (
                    <button
                      key={bt.value}
                      data-testid={`btype-${bt.value}`}
                      onClick={() => setBusinessType(bt.value)}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg text-sm text-left transition-all border"
                      style={{
                        borderColor: businessType === bt.value ? "hsl(var(--primary))" : "hsl(var(--border))",
                        background: businessType === bt.value ? "hsl(var(--accent))" : "transparent",
                        color: "hsl(var(--foreground))",
                        fontWeight: businessType === bt.value ? 600 : 400,
                      }}
                    >
                      <span>{bt.emoji}</span>
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Brief Description (optional)
                </label>
                <Textarea
                  data-testid="input-description"
                  placeholder="e.g. Family dental practice in Austin, TX serving patients since 2010"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Your Phone Number (optional)
                </label>
                <Input
                  data-testid="input-phone"
                  placeholder="+1 512 555 0100"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <Button
                data-testid="btn-continue"
                className="w-full"
                disabled={!businessName || !businessType}
                onClick={() => setStep(2)}
                style={{ background: "hsl(var(--primary))", color: "white" }}
              >
                Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Confirm + Generate */}
        {step === 2 && (
          <Card style={{ borderColor: "hsl(var(--border))" }}>
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold mb-1">Ready to go live</h2>
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  We'll use AI to generate your greeting, intake fields, and FAQs automatically.
                </p>
              </div>

              <div className="rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--muted))" }}>
                <div className="flex items-center gap-2">
                  <Building2 size={16} style={{ color: "hsl(var(--primary))" }} />
                  <span className="font-semibold text-sm">{businessName}</span>
                </div>
                <div className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Type: <span className="capitalize">{businessType}</span>
                </div>
                {phone && (
                  <div className="text-sm flex items-center gap-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Phone size={12} /> {phone}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                <p>✓ AI greeting customized for your business type</p>
                <p>✓ Intake fields generated automatically</p>
                <p>✓ FAQs pre-populated</p>
                <p>✓ Phone number assigned instantly</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  data-testid="btn-go-live"
                  className="flex-2"
                  onClick={() => createTenantMutation.mutate()}
                  disabled={createTenantMutation.isPending}
                  style={{ background: "hsl(var(--primary))", color: "white", flex: 2 }}
                >
                  <Sparkles size={14} className="mr-1.5" />
                  {createTenantMutation.isPending ? "Generating AI config..." : "Go Live"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Done */}
        {step === 3 && schema && (
          <Card style={{ borderColor: "hsl(var(--border))" }}>
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: "hsl(var(--accent))" }}>
                  <CheckCircle size={28} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <h2 className="text-lg font-bold">Your AI receptionist is live!</h2>
                <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {businessName} is ready to answer calls.
                </p>
              </div>

              <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--muted))" }}>
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>AI Greeting</div>
                  <p className="text-sm italic">"{schema.greeting}"</p>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {schema.fields.length} Intake Fields · {schema.faqs.length} FAQs generated
                  </div>
                </div>
              </div>

              <Button
                data-testid="btn-go-dashboard"
                className="w-full"
                onClick={() => navigate(`/tenants/${tenantId}/dashboard`)}
                style={{ background: "hsl(var(--primary))", color: "white" }}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
