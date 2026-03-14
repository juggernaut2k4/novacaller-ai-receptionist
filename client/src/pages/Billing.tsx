import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Clock, Gift } from "lucide-react";

interface BillingData {
  minutesUsed: number;
  creditBalance: number;
  gross: number;
  applied: number;
  charged: number;
  nextMonthCredit: number;
}

export default function Billing() {
  const { tenant } = useAuth();
  const id = tenant?.id;

  const { data: billing, isLoading } = useQuery<BillingData>({
    queryKey: ["/api/tenants", id, "billing"],
    queryFn: () => apiRequest("GET", `/api/tenants/${id}/billing`),
    enabled: !!id,
  });

  const blocksUsed = billing ? Math.ceil(billing.minutesUsed / 100) : 0;
  const ratePerBlock = 10;

  // Breakdown per 100-min block
  const blocks = billing ? Array.from({ length: blocksUsed }, (_, i) => {
    const startMin = i * 100;
    const endMin = Math.min((i + 1) * 100, billing.minutesUsed);
    const blockMins = endMin - startMin;
    return {
      block: i + 1,
      minsInBlock: blockMins.toFixed(1),
      cost: ratePerBlock,
      cogs: (blockMins * 0.14).toFixed(2),
    };
  }) : [];

  if (isLoading) return <div className="p-8 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold mb-1">Billing</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          $10 per 100 minutes used · billed monthly
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Minutes Used", value: (billing?.minutesUsed ?? 0).toFixed(0), icon: Clock, sub: "this month" },
          { label: "Gross Charge", value: `$${billing?.gross ?? 0}`, icon: DollarSign, sub: `${blocksUsed} × $10` },
          { label: "Credit Applied", value: `$${billing?.applied ?? 0}`, icon: Gift, sub: "from last month" },
          { label: "Amount Due", value: `$${billing?.charged ?? 0}`, icon: TrendingUp, sub: "net due" },
        ].map(({ label, value, icon: Icon, sub }) => (
          <Card key={label} style={{ borderColor: "hsl(var(--border))" }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
                <Icon size={14} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div className="text-xl font-bold" data-testid={`billing-${label.toLowerCase().replace(" ","-")}`}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next month credit alert */}
      {(billing?.nextMonthCredit ?? 0) > 0 && (
        <Card style={{ background: "hsl(var(--accent))", borderColor: "hsl(var(--border))" }}>
          <CardContent className="p-4 flex items-center gap-3">
            <Gift size={18} style={{ color: "hsl(var(--primary))" }} />
            <div>
              <div className="text-sm font-semibold">$10 credit earned for next month</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                You used less than 100 minutes this month. A $10 credit will be applied to your next bill.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Block breakdown */}
      <Card style={{ borderColor: "hsl(var(--border))" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Usage Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {blocks.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              No usage recorded yet.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))", borderBottom: "1px solid hsl(var(--border))" }}>
                <span>Block</span>
                <span>Minutes</span>
                <span>Revenue</span>
                <span>COGS</span>
              </div>
              <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                {blocks.map(b => (
                  <div key={b.block} className="grid grid-cols-4 gap-2 px-4 py-2.5 text-sm" data-testid={`block-row-${b.block}`}>
                    <span className="font-medium">Block {b.block}</span>
                    <span>{b.minsInBlock} min</span>
                    <span style={{ color: "hsl(var(--primary))" }}>${b.cost}</span>
                    <span className="text-orange-600 dark:text-orange-400">${b.cogs}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 px-4 py-3 text-sm font-semibold" style={{ borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--muted))" }}>
                <span>Total</span>
                <span>{(billing?.minutesUsed ?? 0).toFixed(0)} min</span>
                <span style={{ color: "hsl(var(--primary))" }}>${billing?.gross ?? 0}</span>
                <span className="text-orange-600 dark:text-orange-400">${((billing?.minutesUsed ?? 0) * 0.14).toFixed(2)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pricing info */}
      <Card style={{ borderColor: "hsl(var(--border))" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Pricing Model</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          <div className="flex justify-between"><span>Rate</span><span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>$10 per 100 minutes</span></div>
          <div className="flex justify-between"><span>Billing unit</span><span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>Minutes consumed</span></div>
          <div className="flex justify-between"><span>Low-usage credit</span><span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>$10 credit if &lt;100 mins/month</span></div>
          <div className="flex justify-between"><span>Billing cycle</span><span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>Monthly</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
