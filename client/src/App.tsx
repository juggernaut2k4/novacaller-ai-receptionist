import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import Landing from "@/pages/Landing";
import SignUp from "@/pages/SignUp";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CallLog from "@/pages/CallLog";
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import Sidebar from "@/components/Sidebar";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function AppRoutes({ theme, setTheme }: { theme: "light" | "dark"; setTheme: (t: "light" | "dark") => void }) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      {user && <Sidebar theme={theme} setTheme={setTheme} />}
      <main className="flex-1 overflow-auto">
        <Router hook={useHashLocation}><Switch>
          {/* Public routes */}
          <Route path="/" component={user ? () => <Redirect to="/dashboard" /> : Landing} />
          <Route path="/signup" component={user ? () => <Redirect to="/dashboard" /> : SignUp} />
          <Route path="/login" component={user ? () => <Redirect to="/dashboard" /> : Login} />

          {/* Protected routes */}
          <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
          <Route path="/calls">{() => <ProtectedRoute component={CallLog} />}</Route>
          <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
          <Route path="/billing">{() => <ProtectedRoute component={Billing} />}</Route>

          {/* Catch-all */}
          <Route component={NotFound} />
        </Switch></Router>
      </main>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes theme={theme} setTheme={setTheme} />
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
