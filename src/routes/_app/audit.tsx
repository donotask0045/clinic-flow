import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Eye } from "lucide-react";

type Row = {
  id: string;
  created_at: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  device: string | null;
  before_data: unknown;
  after_data: unknown;
};

export const Route = createFileRoute("/_app/audit")({
  component: AuditPage,
});

function AuditPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) toast.error(error.message);
    const list = (data ?? []) as Row[];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.actor_id).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, username").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: { id: string; full_name: string | null; username: string | null }) => {
        map[p.id] = p.full_name || p.username || p.id.slice(0, 8);
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      r.action.toLowerCase().includes(s) ||
      (r.entity_type ?? "").toLowerCase().includes(s) ||
      (profiles[r.actor_id ?? ""] ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight">{t("auditLogs")}</h1>
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="ps-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">{t("noAudit")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("when")}</TableHead>
                  <TableHead>{t("actor")}</TableHead>
                  <TableHead>{t("action")}</TableHead>
                  <TableHead>{t("entity")}</TableHead>
                  <TableHead>{t("ipAddress")}</TableHead>
                  <TableHead className="text-end">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell>{r.actor_id ? (profiles[r.actor_id] ?? r.actor_id.slice(0, 8)) : "—"}</TableCell>
                    <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{r.entity_type ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.ip_address ?? "—"}</TableCell>
                    <TableCell className="text-end">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>
                        <Eye className="h-4 w-4 me-1" />{t("viewDetails")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("details")}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("when")}: </span>{new Date(selected.created_at).toLocaleString()}</div>
                <div><span className="text-muted-foreground">{t("actor")}: </span>{selected.actor_id ? (profiles[selected.actor_id] ?? selected.actor_id) : "—"}</div>
                <div><span className="text-muted-foreground">{t("action")}: </span>{selected.action}</div>
                <div><span className="text-muted-foreground">{t("entity")}: </span>{selected.entity_type ?? "—"} {selected.entity_id ? `· ${selected.entity_id.slice(0, 8)}` : ""}</div>
                <div><span className="text-muted-foreground">{t("ipAddress")}: </span>{selected.ip_address ?? "—"}</div>
                <div><span className="text-muted-foreground">{t("device")}: </span>{selected.device ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">{t("beforeData")}</div>
                <RecordLines data={selected.before_data} />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">{t("afterData")}</div>
                <RecordLines data={selected.after_data} />
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
