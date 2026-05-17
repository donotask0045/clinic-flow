import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useServerFn } from "@tanstack/react-start";
import { dispensePrescriptionItem, closeVisit } from "@/lib/clinic.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pill, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/pharmacy")({ component: PharmacyPage });

type Item = {
  id: string; medicine_id: string; quantity: number; dispensed_pills: number;
  unit: "pill" | "strip" | "box";
  medicines: { name: string; total_pills: number; pills_per_strip: number; strips_per_box: number } | null;
};
type QueueVisit = {
  id: string; priority: string; status: string; created_at: string;
  patients: { full_name: string; military_number: string } | null;
  prescriptions: { id: string; prescription_items: Item[] }[];
};

const pillsFor = (it: Item) => {
  const m = it.medicines;
  if (!m) return it.quantity;
  if (it.unit === "pill") return it.quantity;
  if (it.unit === "strip") return it.quantity * m.pills_per_strip;
  return it.quantity * m.pills_per_strip * m.strips_per_box;
};

function PharmacyPage() {
  const { t } = useI18n();
  const dispense = useServerFn(dispensePrescriptionItem);
  const close = useServerFn(closeVisit);
  const [rows, setRows] = useState<QueueVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visits")
      .select(`id, priority, status, created_at,
        patients(full_name, military_number),
        prescriptions(id, prescription_items(id, medicine_id, quantity, dispensed_pills, unit,
          medicines(name, total_pills, pills_per_strip, strips_per_box)))`)
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) toast.error(error.message);
    const filtered = ((data ?? []) as unknown as QueueVisit[]).filter(
      (v) => v.prescriptions?.some((rx) => rx.prescription_items?.length > 0),
    );
    setRows(filtered); setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("pharmacy-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "visits" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "prescription_items" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const dispenseItem = async (item: Item, pills: number) => {
    setBusy(item.id);
    try {
      const res = await dispense({ data: { item_id: item.id, pills } }) as { dispensed: number; missing: number };
      if (res.missing > 0) toast.warning(`${t("partialDispense")} (${res.dispensed}/${pills})`);
      else toast.success(`${t("dispensed")}: ${res.dispensed}`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  };

  const closeQueueVisit = async (v: QueueVisit) => {
    try { await close({ data: { visit_id: v.id } }); toast.success(t("visitClosed")); load(); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("pharmacyQueue")}</h1>
      </div>

      {loading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent></Card>
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">{t("noQueue")}</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {rows.map((v) => {
            const items = v.prescriptions.flatMap((rx) => rx.prescription_items);
            const allDone = items.every((it) => it.dispensed_pills >= pillsFor(it));
            return (
              <Card key={v.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Pill className="h-4 w-4" />{v.patients?.full_name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{v.patients?.military_number} · {new Date(v.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{t(v.priority as "low")}</Badge>
                    <Button size="sm" variant={allDone ? "default" : "outline"} onClick={() => closeQueueVisit(v)}>
                      <CheckCircle2 className="h-4 w-4 me-1" />{t("closeVisit")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-start">{t("medicine")}</th>
                        <th className="px-4 py-2 text-start">{t("quantity")}</th>
                        <th className="px-4 py-2 text-start">{t("dispensed")}</th>
                        <th className="px-4 py-2 text-end">{t("actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => {
                        const need = pillsFor(it);
                        const remaining = Math.max(0, need - it.dispensed_pills);
                        const stock = it.medicines?.total_pills ?? 0;
                        return (
                          <DispenseRow key={it.id} it={it} need={need} remaining={remaining}
                            stock={stock} busy={busy === it.id}
                            onDispense={(n) => dispenseItem(it, n)} />
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DispenseRow({ it, need, remaining, stock, busy, onDispense }:
  { it: Item; need: number; remaining: number; stock: number; busy: boolean; onDispense: (n: number) => void }) {
  const { t } = useI18n();
  const [n, setN] = useState(remaining);
  useEffect(() => setN(remaining), [remaining]);
  const insufficient = n > stock;
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3 font-medium">{it.medicines?.name}</td>
      <td className="px-4 py-3 tabular-nums">{need} {t("pill")}</td>
      <td className="px-4 py-3 tabular-nums">{it.dispensed_pills} / {need}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Input type="number" className="h-8 w-20" min={0} max={remaining} value={n} onChange={(e) => setN(Number(e.target.value))} disabled={remaining === 0} />
          <Button size="sm" disabled={busy || remaining === 0 || n <= 0} onClick={() => onDispense(n)}
            variant={insufficient ? "outline" : "default"}>
            {insufficient ? t("partialDispense") : t("dispense")}
          </Button>
          {stock < n && <span className="text-xs text-destructive">{t("insufficientStock")} ({stock})</span>}
        </div>
      </td>
    </tr>
  );
}
