import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tenant } from "@shared/schema";
import { Link } from "wouter";
import { Building2, PhoneCall, Plus, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function calcBill(mins: number) {
  return Math.ceil(mins / 100) * 10;
}

export default function TenantSelect() {
  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
    queryFn: () => apiRequest("GET", "/api/tenants"),
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
          Your Businesses
        </h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Select a business to manage its AI receptionist
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {tenants.map(t => (
            <Link key={t.id} href={`/tenants/${t.id}/dashboard`}>
              <Card
                data-testid={`tenant-card-${t.id}`}
                className="cursor-pointer hover:shadow-md transition-shadow border"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "hsl(var(--accent))" }}>
                        <Building2 size={18} style={{ color: "hsl(var(--primary))" }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs capitalize" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {t.businessType}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className="text-xs"
                      style={{
                        background: t.status === "active" ? "hsl(var(--success))" : "hsl(var(--warning))",
                        color: "white",
                        border: "none"
                      }}
                    >
                      {t.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>
                        {t.minutesUsed.toFixed(0)}
                      </div>
                      <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>mins used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                        ${calcBill(t.minutesUsed)}
                      </div>
                      <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>this month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                        {t.assignedNumber ? t.assignedNumber.slice(-4) : "—"}
                      </div>
                      <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>phone ext</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Add new */}
          <Link href="/onboarding">
            <Card
              data-testid="add-business-card"
              className="cursor-pointer border-dashed hover:shadow-md transition-shadow flex items-center justify-center h-40"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: "hsl(var(--muted))" }}>
                  <Plus size={20} style={{ color: "hsl(var(--muted-foreground))" }} />
                </div>
                <div className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Add New Business
                </div>
              </div>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
