import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tenant, IntakeField, Faq, EscalationRule } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Trash2, Save, GripVertical, MessageSquare, HelpCircle,
  AlertTriangle, Zap, Copy, CheckCircle, ExternalLink
} from "lucide-react";

type Tab = "ai" | "vapi";

export default function Settings() {
  const { tenant: authTenant } = useAuth();
  const id = authTenant?.id;
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("ai");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: tenant, isLoading: tLoading } = useQuery<Tenant>({
    queryKey: ["/api/tenants", id],
    queryFn: () => apiRequest("GET", `/api/tenants/${id}`),
    enabled: !!id,
  });

  const { data: fields = [], isLoading: fLoading } = useQuery<IntakeField[]>({
    queryKey: ["/api/tenants", id, "intake-fields"],
    queryFn: () => apiRequest("GET", `/api/tenants/${id}/intake-fields`),
    enabled: !!id,
  });

  const { data: faqs = [] } = useQuery<Faq[]>({
    queryKey: ["/api/tenants", id, "faqs"],
    queryFn: () => apiRequest("GET", `/api/tenants/${id}/faqs`),
    enabled: !!id,
  });

  const { data: rules = [] } = useQuery<EscalationRule[]>({
    queryKey: ["/api/tenants", id, "escalation-rules"],
    queryFn: () => apiRequest("GET", `/api/tenants/${id}/escalation-rules`),
    enabled: !!id,
  });

  // Local edits
  const [greeting, setGreeting] = useState<string | null>(null);
  const [persona, setPersona] = useState<string | null>(null);

  const updateTenantMutation = useMutation({
    mutationFn: (data: Partial<Tenant>) => apiRequest("PATCH", `/api/tenants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", id] });
      toast({ title: "Settings saved" });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (fid: string) => apiRequest("DELETE", `/api/intake-fields/${fid}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", id, "intake-fields"] });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (fid: string) => apiRequest("DELETE", `/api/faqs/${fid}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", id, "faqs"] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (rid: string) => apiRequest("DELETE", `/api/escalation-rules/${rid}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", id, "escalation-rules"] });
    },
  });

  const addFaqMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tenants/${id}/faqs`, {
      question: "New question", answer: "Answer here", order: faqs.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", id, "faqs"] });
    },
  });

  const addRuleMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tenants/${id}/escalation-rules`, {
      trigger: "emergency", action: "transfer", destination: "", message: "",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", id, "escalation-rules"] });
    },
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (tLoading) return <div className="p-8 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  // Derive URLs from current location
  const origin = window.location.origin;
  const webhookUrl = `${origin}/api/vapi/webhook`;
  const webhookSecret = "aireceptionist_demo_secret_2026";
  const assignedNumber = authTenant?.assignedNumber || "No number assigned";

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold mb-1">AI Settings</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Configure how your AI receptionist sounds and behaves
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "hsl(var(--muted))" }}>
        {(["ai", "vapi"] as Tab[]).map(t => (
          <button
            key={t}
            data-testid={`tab-${t}`}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              background: tab === t ? "hsl(var(--background))" : "transparent",
              color: tab === t ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t === "ai" ? "AI Configuration" : "⚡ Vapi Integration"}
          </button>
        ))}
      </div>

      {/* ── AI CONFIGURATION TAB ─────────────────────────────────────────────── */}
      {tab === "ai" && (
        <>
          {/* Greeting & Persona */}
          <Card style={{ borderColor: "hsl(var(--border))" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare size={15} style={{ color: "hsl(var(--primary))" }} />
                AI Voice & Greeting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Opening Greeting
                </label>
                <Textarea
                  data-testid="input-greeting"
                  className="text-sm resize-none"
                  rows={2}
                  value={greeting ?? (tenant?.greeting || "")}
                  onChange={e => setGreeting(e.target.value)}
                  placeholder="What does the AI say when it answers a call?"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                  AI Persona Instructions
                </label>
                <Textarea
                  data-testid="input-persona"
                  className="text-sm resize-none"
                  rows={2}
                  value={persona ?? (tenant?.aiPersona || "")}
                  onChange={e => setPersona(e.target.value)}
                  placeholder="Describe how the AI should sound and behave..."
                />
              </div>
              <Button
                data-testid="save-ai-settings"
                size="sm"
                onClick={() => updateTenantMutation.mutate({
                  greeting: greeting ?? tenant?.greeting ?? "",
                  aiPersona: persona ?? tenant?.aiPersona ?? "",
                })}
                disabled={updateTenantMutation.isPending}
                style={{ background: "hsl(var(--primary))", color: "white" }}
              >
                <Save size={13} className="mr-1.5" />
                {updateTenantMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Intake Fields */}
          <Card style={{ borderColor: "hsl(var(--border))" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <GripVertical size={15} style={{ color: "hsl(var(--primary))" }} />
                  Intake Fields
                </span>
                <Badge className="text-xs" variant="secondary">{fields.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {fLoading ? <Skeleton className="h-10" /> : fields.map(f => (
                <div key={f.id} data-testid={`field-row-${f.id}`}
                  className="flex items-center gap-2 p-2 rounded-md"
                  style={{ background: "hsl(var(--muted))" }}>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{f.label}</span>
                    <span className="text-xs ml-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {f.fieldType}
                      {f.required && <span className="ml-1 text-red-500">*</span>}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteFieldMutation.mutate(f.id)}
                    className="p-1 rounded hover:opacity-70"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <p className="text-xs pt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                Intake fields are auto-generated during onboarding. Re-run onboarding to regenerate.
              </p>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card style={{ borderColor: "hsl(var(--border))" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <HelpCircle size={15} style={{ color: "hsl(var(--primary))" }} />
                  FAQs
                </span>
                <button
                  data-testid="add-faq-btn"
                  onClick={() => addFaqMutation.mutate()}
                  className="text-xs flex items-center gap-1 hover:opacity-70"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  <Plus size={12} /> Add
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {faqs.length === 0 ? (
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>No FAQs yet.</p>
              ) : faqs.map(faq => (
                <div key={faq.id} data-testid={`faq-row-${faq.id}`}
                  className="p-3 rounded-md space-y-1"
                  style={{ background: "hsl(var(--muted))" }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{faq.question}</span>
                    <button onClick={() => deleteFaqMutation.mutate(faq.id)} className="p-0.5 hover:opacity-70 flex-shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Escalation Rules */}
          <Card style={{ borderColor: "hsl(var(--border))" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle size={15} style={{ color: "hsl(var(--primary))" }} />
                  Escalation Rules
                </span>
                <button
                  data-testid="add-rule-btn"
                  onClick={() => addRuleMutation.mutate()}
                  className="text-xs flex items-center gap-1 hover:opacity-70"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  <Plus size={12} /> Add
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rules.length === 0 ? (
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>No escalation rules configured.</p>
              ) : rules.map(rule => (
                <div key={rule.id} data-testid={`rule-row-${rule.id}`}
                  className="flex items-center gap-2 p-3 rounded-md"
                  style={{ background: "hsl(var(--muted))" }}>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium capitalize">If: "{rule.trigger}"</span>
                    <span className="text-xs ml-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                      → {rule.action} {rule.destination ? `to ${rule.destination}` : ""}
                    </span>
                  </div>
                  <button onClick={() => deleteRuleMutation.mutate(rule.id)} className="p-0.5 hover:opacity-70" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── VAPI INTEGRATION TAB ─────────────────────────────────────────────── */}
      {tab === "vapi" && (
        <div className="space-y-4">

          {/* Status banner */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ background: "hsl(183 98% 22% / 0.1)", border: "1px solid hsl(183 98% 22% / 0.3)" }}>
            <Zap size={16} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>
                Ready to connect to Vapi
              </p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                Add the values below to your Vapi dashboard. The assistant config is fully driven by your AI Settings — any change you make here is reflected instantly.
              </p>
            </div>
          </div>

          {/* Step 1 — Server URL (Webhook) */}
          <Card style={{ borderColor: "hsl(var(--border))" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white" style={{ background: "hsl(var(--primary))" }}>1</span>
                Server URL (Webhook)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                In your Vapi dashboard → Assistant → <strong>Server URL</strong>. Vapi sends end-of-call reports here.
              </p>
              <CopyRow label="Server URL" value={webhookUrl} copyKey="webhook" copied={copied} onCopy={copyToClipboard} />
              <CopyRow label="Secret Header" value={`x-vapi-secret: ${webhookSecret}`} copyKey="secret" copied={copied} onCopy={copyToClipboard}
                note="Add this as a custom header in Vapi's Server URL settings so calls are authenticated." />
            </CardContent>
          </Card>

          {/* Step 2 — Phone-Based Routing */}
          <Card style={{ borderColor: "hsl(var(--border))" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white" style={{ background: "hsl(var(--primary))" }}>2</span>
                Assigned Phone Number
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                Your AI receptionist is assigned this phone number. When Vapi receives a call on this number, our webhook automatically looks up your business and returns your custom assistant configuration — no metadata or manual config needed.
              </p>
              <CopyRow
                label="AI Phone Number"
                value={assignedNumber}
                copyKey="phone"
                copied={copied}
                onCopy={copyToClipboard}
              />
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                Forward your business line to this number, or assign it directly in your Vapi dashboard. Calls are automatically routed to <strong>{tenant?.name}</strong> based on the phone number.
              </p>
            </CardContent>
          </Card>

          {/* Open Vapi */}
          <a
            href="https://dashboard.vapi.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "hsl(var(--primary))", color: "white" }}
          >
            <ExternalLink size={14} />
            Open Vapi Dashboard
          </a>
        </div>
      )}
    </div>
  );
}

// ── Reusable copy row component ───────────────────────────────────────────────
function CopyRow({
  label, value, copyKey, copied, onCopy, note
}: {
  label: string;
  value: string;
  copyKey: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  note?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</label>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 text-xs px-3 py-2 rounded-md truncate"
          style={{ background: "hsl(var(--muted))", fontFamily: "monospace" }}
        >
          {value}
        </code>
        <button
          data-testid={`copy-${copyKey}`}
          onClick={() => onCopy(value, copyKey)}
          className="flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium flex-shrink-0 transition-opacity hover:opacity-80"
          style={{
            background: copied === copyKey ? "hsl(142 70% 45%)" : "hsl(var(--primary))",
            color: "white",
          }}
        >
          {copied === copyKey ? <CheckCircle size={12} /> : <Copy size={12} />}
          {copied === copyKey ? "Copied!" : "Copy"}
        </button>
      </div>
      {note && <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{note}</p>}
    </div>
  );
}
