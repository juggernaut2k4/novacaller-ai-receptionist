import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tenant, Call } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { PhoneCall, Clock, TrendingUp, AlertCircle, Zap, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function SentimentBadge({ s }: { s: string | null }) {
  const map: Record<string, string> = {
    positive: "sentiment-positive",
    negative: "sentiment-negative",
    urgent: "sentiment-urgent",
    neutral: "sentiment-neutral",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[s ?? "neutral"] || map.neutral}`}>{s || "neutral"}</span>;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const { tenant: authTenant } = useAuth();
  const id = authTenant?.id;
  const { toast } = useToast();

  const { data: tenant, isLoading: tLoading } = useQuery<Tenant>({
    queryKey: ["/api/tenants", id],
    queryFn: () => apiRequest("GET", `/api/tenants/${id}`),
    enabled: !!id,
  });

  const { data: calls = [], isLoading: cLoading } = useQuery<Call[]>({
    queryKey: ["/api/tenants", id, "calls"],
    queryFn: () => apiRequest("GET", `/api/tenants/${id}/calls`),
    enabled: !!id,
  });

  const simulateMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tenants/${id}/simulate-call`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", id, "calls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", id] });
      toast({ title: "Simulated call logged", description: "A new demo call has been added." });
    },
  });

  const recentCalls = calls.slice(0, 8);
  const totalMins = tenant?.minutesUsed ?? 0;
  const completedCalls = calls.filter(c => c.status === "completed").length;
  const escalatedCalls = calls.filter(c => c.escalated).length;
  const positiveSentiment = calls.filter(c => c.sentiment === "positive").length;
  const currentBill = Math.ceil(totalMins / 100) * 10;

  if (tLoading) return (
    <div className="p-8 space-y-4">
      {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
            {tenant?.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${tenant?.status === "active" ? "bg-green-500" : "bg-yellow-500"}`} />
            <span className="text-sm capitalize" style={{ color: "hsl(var(--muted-foreground))" }}>
              {tenant?.status} · {tenant?.assignedNumber || "No number assigned"}
            </span>
          </div>
        </div>
        <Button
          data-testid="simulate-call-btn"
          size="sm"
          onClick={() => simulateMutation.mutate()}
          disabled={simulateMutation.isPending}
          style={{ background: "hsl(var(--primary))", color: "white" }}
        >
          <Zap size={14} className="mr-1.5" />
          {simulateMutation.isPending ? "Simulating..." : "Simulate Call"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Minutes Used", value: totalMins.toFixed(0), icon: Clock, sub: "this month" },
          { label: "Total Calls", value: calls.length, icon: PhoneCall, sub: `${completedCalls} completed` },
          { label: "Escalated", value: escalatedCalls, icon: AlertCircle, sub: "this month" },
          { label: "Current Bill", value: `$${currentBill}`, icon: BarChart2, sub: `${Math.ceil(totalMins/100)} blocks × $10` },
        ].map(({ label, value, icon: Icon, sub }) => (
          <Card key={label} style={{ borderColor: "hsl(var(--border))" }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
                <Icon size={14} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div className="text-xl font-bold" data-testid={`kpi-${label.toLowerCase().replace(" ","-")}`}>
                {value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Greeting Preview */}
      {tenant?.greeting && (
        <Card className="mb-6" style={{ background: "hsl(var(--accent))", borderColor: "hsl(var(--border))" }}>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: "hsl(var(--primary))" }}>
                <PhoneCall size={12} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--primary))" }}>AI Greeting</div>
                <div className="text-sm italic" style={{ color: "hsl(var(--foreground))" }}>"{tenant.greeting}"</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Calls */}
      <Card style={{ borderColor: "hsl(var(--border))" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Calls</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : recentCalls.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              No calls yet. Click "Simulate Call" to generate demo data.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
              {recentCalls.map(call => (
                <div key={call.id} className="flex items-start gap-3 px-4 py-3" data-testid={`call-row-${call.id}`}>
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      call.status === "escalated" ? "bg-orange-500" :
                      call.status === "missed" ? "bg-red-400" : "bg-green-500"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{call.callerName || call.callerNumber || "Unknown"}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <SentimentBadge s={call.sentiment} />
                        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {call.durationMinutes.toFixed(1)}m
                        </span>
                        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {timeAgo(call.startedAt)}
                        </span>
                      </div>
                    </div>
                    {call.aiSummary && (
                      <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {call.aiSummary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
