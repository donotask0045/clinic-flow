import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

type Row = {
  id: string;
  missing_pills: number;
  request_count: number;
  last_requested_at: string;
  resolved: boolean;
  medicines: { name: string; commercial_name: string | null } | null;
};

export const Route = createFileRoute("/_app/shortages")({
  component: ShortagesPage,
});

function ShortagesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"unresolved" | "resolved" | "all">("unresolved");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("shortages")
      .select("id, missing_pills, request_count, last_requested_at, resolved, medicines(name, commercial_name)")
      .order("last_requested_at", { ascending: false })
      .limit(200);
    if (filter === "unresolved") q = q.eq("resolved", false);
    else if (filter === "resolved") q = q.eq("resolved", true);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("shortages-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "shortages" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const resolve = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.from("shortages").update({ resolved: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(t("resolved")); load(); }
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight">{t("shortages")}</h1>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="unresolved">{t("unresolved")}</TabsTrigger>
            <TabsTrigger value="resolved">{t("resolved")}</TabsTrigger>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent></Card>
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">{t("noShortages")}</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${r.resolved ? "text-muted-foreground" : "text-destructive"}`} />
                  <CardTitle className="text-base">
                    {r.medicines?.name ?? "—"}
                    {r.medicines?.commercial_name ? <span className="text-xs text-muted-foreground ms-2">({r.medicines.commercial_name})</span> : null}
                  </CardTitle>
                </div>
                {r.resolved ? (
                  <Badge variant="secondary">{t("resolved")}</Badge>
                ) : (
                  <Button size="sm" disabled={busy === r.id} onClick={() => resolve(r.id)}>
                    <CheckCircle2 className="h-4 w-4 me-1" />{t("markResolved")}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">{t("missingPills")}: </span><span className="font-medium">{r.missing_pills}</span></div>
                <div><span className="text-muted-foreground">{t("requestCount")}: </span><span className="font-medium">{r.request_count}</span></div>
                <div><span className="text-muted-foreground">{t("lastRequested")}: </span>{new Date(r.last_requested_at).toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
