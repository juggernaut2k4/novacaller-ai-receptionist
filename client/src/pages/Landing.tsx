import { Link } from "wouter";
import { Phone, ArrowRight, CheckCircle, Zap, Shield, Clock, Building2, Stethoscope, Wrench, Scale, UtensilsCrossed, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const businessTypes = [
  { icon: Stethoscope, label: "Dental & Medical", desc: "Appointment scheduling, insurance intake, emergency triage" },
  { icon: Wrench, label: "HVAC & Plumbing", desc: "Service requests, emergency dispatch, parts inquiries" },
  { icon: Scale, label: "Law Firms", desc: "Client intake, consultation scheduling, case screening" },
  { icon: UtensilsCrossed, label: "Restaurants", desc: "Reservations, hours, menu inquiries, catering" },
  { icon: Scissors, label: "Salons & Spas", desc: "Appointment booking, service info, cancellations" },
  { icon: Building2, label: "Any Business", desc: "Custom intake fields, FAQs, and escalation rules" },
];

const steps = [
  { num: "1", title: "Sign Up & Configure", desc: "Tell us about your business. We auto-generate intake fields, FAQs, and AI behavior." },
  { num: "2", title: "Connect Your Phone", desc: "Get an AI phone number. Calls are routed to your custom-trained receptionist instantly." },
  { num: "3", title: "Go Live", desc: "Your AI answers calls 24/7, collects data, answers questions, and escalates emergencies." },
];

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
            <Zap size={12} />
            AI-Powered Phone Reception
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4" style={{ color: "hsl(var(--foreground))" }}>
            Never Miss a Call.<br />
            <span style={{ color: "hsl(var(--primary))" }}>Your AI Receptionist</span> is Ready.
          </h1>

          <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: "hsl(var(--muted-foreground))" }}>
            NovaCaller answers your business calls 24/7 with a custom AI voice. It collects intake data,
            answers FAQs, and escalates emergencies — so you never miss a lead.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" style={{ background: "hsl(var(--primary))", color: "white" }} className="text-sm font-semibold px-6">
                Get Started Free
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-sm font-semibold px-6">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-6 mt-12 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span className="flex items-center gap-1.5"><CheckCircle size={13} style={{ color: "hsl(var(--primary))" }} /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Shield size={13} style={{ color: "hsl(var(--primary))" }} /> HIPAA-friendly</span>
            <span className="flex items-center gap-1.5"><Clock size={13} style={{ color: "hsl(var(--primary))" }} /> Setup in 2 minutes</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6" style={{ background: "hsl(var(--muted))" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "hsl(var(--foreground))" }}>
            How It Works
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: "hsl(var(--muted-foreground))" }}>
            Get your AI receptionist live in three simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(s => (
              <Card key={s.num} style={{ borderColor: "hsl(var(--border))" }}>
                <CardContent className="p-5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white mb-3"
                    style={{ background: "hsl(var(--primary))" }}>
                    {s.num}
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>{s.title}</h3>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Types */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "hsl(var(--foreground))" }}>
            Built for Every Business
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: "hsl(var(--muted-foreground))" }}>
            Pre-built templates for common industries, fully customizable for any business type
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {businessTypes.map(({ icon: Icon, label, desc }) => (
              <Card key={label} style={{ borderColor: "hsl(var(--border))" }}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}>
                    <Icon size={16} style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-0.5" style={{ color: "hsl(var(--foreground))" }}>{label}</h3>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6" style={{ background: "hsl(var(--muted))" }}>
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>Simple Pricing</h2>
          <p className="text-sm mb-8" style={{ color: "hsl(var(--muted-foreground))" }}>
            Pay only for what you use. No contracts, no hidden fees.
          </p>

          <Card style={{ borderColor: "hsl(var(--primary))", borderWidth: "2px" }}>
            <CardContent className="p-6">
              <div className="text-3xl font-bold mb-1" style={{ color: "hsl(var(--primary))" }}>$10</div>
              <div className="text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>per 100 minutes</div>
              <div className="space-y-2 text-left text-sm mb-6">
                {[
                  "Custom AI voice & greeting",
                  "Auto-generated intake fields",
                  "FAQ knowledge base",
                  "Emergency escalation rules",
                  "Call transcripts & summaries",
                  "$10 credit if under 100 mins/month",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle size={14} style={{ color: "hsl(var(--primary))" }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup">
                <Button className="w-full" style={{ background: "hsl(var(--primary))", color: "white" }}>
                  Start Free
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Phone size={12} className="text-white" />
          </div>
          <span className="font-bold text-sm" style={{ color: "hsl(var(--foreground))" }}>NovaCaller</span>
        </div>
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          AI Receptionist Platform &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
