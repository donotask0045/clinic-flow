import { Link, useLocation, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth, type AppRole } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Stethoscope, Pill, Boxes, AlertTriangle,
  ShieldCheck, FileSearch, Bell, LogOut, Languages, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: ReactNode; roles: AppRole[] };

export function AppShell() {
  const { user, loading, signOut } = useAuth();
  const { t, lang, setLang, dir } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Activity className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  const allNav: NavItem[] = [
    { to: "/", label: t("dashboard"), icon: <LayoutDashboard className="h-4 w-4" />, roles: ["admin","doctor","pharmacist"] },
    { to: "/patients", label: t("patients"), icon: <Users className="h-4 w-4" />, roles: ["admin","doctor","pharmacist"] },
    { to: "/visits", label: t("visits"), icon: <Stethoscope className="h-4 w-4" />, roles: ["admin","doctor"] },
    { to: "/pharmacy", label: t("pharmacy"), icon: <Pill className="h-4 w-4" />, roles: ["admin","pharmacist"] },
    { to: "/inventory", label: t("inventory"), icon: <Boxes className="h-4 w-4" />, roles: ["admin","pharmacist"] },
    { to: "/shortages", label: t("shortages"), icon: <AlertTriangle className="h-4 w-4" />, roles: ["admin","pharmacist"] },
    { to: "/users", label: t("users"), icon: <ShieldCheck className="h-4 w-4" />, roles: ["admin"] },
    { to: "/audit", label: t("auditLogs"), icon: <FileSearch className="h-4 w-4" />, roles: ["admin"] },
  ];
  const nav = allNav.filter((n) => user.role && n.roles.includes(user.role));

  const roleLabel = user.role ? t((`role_${user.role}`) as Parameters<typeof t>[0]) : "";

  return (
    <div className="flex min-h-screen bg-background text-foreground" dir={dir}>
      <aside className="hidden w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-sidebar-foreground">{t("appName")}</div>
            <div className="text-xs text-muted-foreground">{t("appTagline")}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 pb-3">
          {nav.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-sidebar-accent/60 px-3 py-2">
            <div className="text-xs text-muted-foreground">{roleLabel}</div>
            <div className="truncate text-sm font-medium text-sidebar-foreground">{user.fullName || user.username}</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="font-semibold">{t("appName")}</span>
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">
            {t("welcome")}, <span className="font-medium text-foreground">{user.fullName || user.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
              <Languages className="h-4 w-4 me-1" />
              {lang === "en" ? "العربية" : "English"}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut().then(() => navigate({ to: "/login" }))}>
              <LogOut className="h-4 w-4 me-1" />
              {t("logout")}
            </Button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
