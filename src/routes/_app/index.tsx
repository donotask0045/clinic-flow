import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Users, Stethoscope, Boxes, AlertTriangle, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function StatCard({ label, value, icon, tone = "primary" }: { label: string; value: number | string; icon: React.ReactNode; tone?: "primary" | "warning" | "destructive" | "success" }) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`grid h-12 w-12 place-items-center rounded-xl ${toneClass}`}>{icon}</div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState({ patientsToday: 0, activeVisits: 0, lowStock: 0, expired: 0, shortages: 0 });

  useEffect(() => {
    const load = async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const [p, v, low, exp, sh] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()),
        supabase.from("visits").select("id", { count: "exact", head: true }).in("status", ["pending","in_progress","partially_dispensed"]),
        supabase.from("medicines").select("id", { count: "exact", head: true }).eq("status", "low_stock"),
        supabase.from("medicines").select("id", { count: "exact", head: true }).eq("status", "expired"),
        supabase.from("shortages").select("id", { count: "exact", head: true }).eq("resolved", false),
      ]);
      setStats({
        patientsToday: p.count ?? 0,
        activeVisits: v.count ?? 0,
        lowStock: low.count ?? 0,
        expired: exp.count ?? 0,
        shortages: sh.count ?? 0,
      });
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("welcome")}, {user?.fullName || user?.username} · {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t("stats_patients_today")} value={stats.patientsToday} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t("stats_active_visits")} value={stats.activeVisits} icon={<Stethoscope className="h-5 w-5" />} tone="success" />
        <StatCard label={t("stats_low_stock")} value={stats.lowStock} icon={<Boxes className="h-5 w-5" />} tone="warning" />
        <StatCard label={t("stats_expired")} value={stats.expired} icon={<CalendarClock className="h-5 w-5" />} tone="destructive" />
        <StatCard label={t("stats_shortages")} value={stats.shortages} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
      </div>

      <Card>
        <CardHeader><CardTitle>{t("quickActions")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <a href="/patients" className="rounded-lg border bg-card p-4 text-sm font-medium hover:bg-accent transition-colors">{t("patients")}</a>
          <a href="/visits" className="rounded-lg border bg-card p-4 text-sm font-medium hover:bg-accent transition-colors">{t("visits")}</a>
          <a href="/pharmacy" className="rounded-lg border bg-card p-4 text-sm font-medium hover:bg-accent transition-colors">{t("pharmacyQueue")}</a>
          <a href="/inventory" className="rounded-lg border bg-card p-4 text-sm font-medium hover:bg-accent transition-colors">{t("inventory")}</a>
        </CardContent>
      </Card>
    </div>
  );
}
