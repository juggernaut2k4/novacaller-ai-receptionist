import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useAuth } from "@/lib/auth";
import { Phone, LayoutDashboard, PhoneCall, Settings, CreditCard, Sun, Moon, LogOut, Building2 } from "lucide-react";

interface Props {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
}

export default function Sidebar({ theme, setTheme }: Props) {
  const [location] = useHashLocation();
  const { tenant, user, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/calls", label: "Call Log", icon: PhoneCall },
    { href: "/settings", label: "AI Settings", icon: Settings },
    { href: "/billing", label: "Billing", icon: CreditCard },
  ];

  const isActive = (href: string) => location === href;

  return (
    <aside
      className="flex flex-col h-screen overflow-y-auto flex-shrink-0"
      style={{
        width: "var(--sidebar-width)",
        background: "hsl(var(--sidebar-background))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
      }}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
          <Phone size={16} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-sm leading-tight" style={{ color: "hsl(var(--sidebar-foreground))" }}>NovaCaller</div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>AI Receptionist</div>
        </div>
      </div>

      {/* Current Business */}
      {tenant && (
        <div className="px-3 py-3" style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}>
          <div className="flex items-center gap-2 px-2 py-2 rounded-md" style={{ background: "hsl(var(--sidebar-accent))" }}>
            <Building2 size={14} style={{ color: "hsl(var(--sidebar-primary))" }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>{tenant.name}</div>
              <div className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{tenant.businessType}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <div
              data-testid={`nav-${label.toLowerCase().replace(" ", "-")}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors"
              style={{
                background: isActive(href) ? "hsl(var(--sidebar-accent))" : "transparent",
                color: isActive(href) ? "hsl(var(--sidebar-foreground))" : "hsl(var(--muted-foreground))",
                fontWeight: isActive(href) ? 600 : 400,
              }}
            >
              <Icon size={16} />
              {label}
            </div>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}>
        {user && (
          <div className="px-3 py-1.5 mb-1 text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
            {user.email}
          </div>
        )}
        <button
          data-testid="logout-btn"
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs w-full hover:opacity-80 transition-opacity"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <LogOut size={12} />
          Sign Out
        </button>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs w-full hover:opacity-80 transition-opacity"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}
