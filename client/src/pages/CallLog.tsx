import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Call } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Clock, Search } from "lucide-react";

function SentimentBadge({ s }: { s: string | null }) {
  const map: Record<string, string> = { positive:"sentiment-positive", negative:"sentiment-negative", urgent:"sentiment-urgent", neutral:"sentiment-neutral" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[s ?? "neutral"] || map.neutral}`}>{s || "neutral"}</span>;
}

function StatusBadge({ s }: { s: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    escalated: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    missed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[s] || styles.completed}`}>{s}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
}

export default function CallLog() {
  const { tenant } = useAuth();
  const id = tenant?.id;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: calls = [], isLoading } = useQuery<Call[]>({
    queryKey: ["/api/tenants", id, "calls"],
    queryFn: () => apiRequest("GET", `/api/tenants/${id}/calls`),
    enabled: !!id,
  });

  const filtered = calls.filter(c => {
    const matchSearch = !search || 
      (c.callerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.aiSummary || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter || c.sentiment === filter;
    return matchSearch && matchFilter;
  });

  const totalMins = calls.reduce((s, c) => s + c.durationMinutes, 0);
  const avgDuration = calls.length ? (totalMins / calls.length).toFixed(1) : "0";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">Call Log</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {calls.length} calls · {totalMins.toFixed(0)} total minutes · {avgDuration} min avg
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
          <Input
            data-testid="search-calls"
            placeholder="Search calls..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 text-sm h-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger data-testid="filter-calls" className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All calls</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          No calls found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(call => (
            <Card key={call.id} data-testid={`call-detail-${call.id}`} style={{ borderColor: "hsl(var(--border))" }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "hsl(var(--muted))" }}>
                    <Phone size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm">{call.callerName || "Unknown Caller"}</span>
                      <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {call.callerNumber}
                      </span>
                      <StatusBadge s={call.status} />
                      <SentimentBadge s={call.sentiment} />
                    </div>
                    {call.aiSummary && (
                      <p className="text-sm mb-2" style={{ color: "hsl(var(--foreground))" }}>{call.aiSummary}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {call.durationMinutes.toFixed(1)} min
                      </span>
                      <span>{formatDate(call.startedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
