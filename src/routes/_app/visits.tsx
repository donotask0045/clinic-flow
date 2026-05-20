import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { closeVisit } from "@/lib/clinic.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Stethoscope, X, CheckCircle2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/visits")({ component: VisitsPage });

type Priority = "low" | "medium" | "high";
type Status = "pending" | "in_progress" | "partially_dispensed" | "dispensed" | "not_available" | "closed";
type Visit = {
  id: string; patient_id: string; status: Status; priority: Priority;
  diagnosis: string | null; notes: string | null; created_at: string;
  patients: { full_name: string; military_number: string } | null;
};

const priorityColor: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary text-secondary-foreground",
  high: "bg-destructive text-destructive-foreground",
};
const statusColor: Record<Status, string> = {
  pending: "bg-warning/20 text-warning-foreground",
  in_progress: "bg-primary/15 text-primary",
  partially_dispensed: "bg-warning/20 text-warning-foreground",
  dispensed: "bg-success/20 text-success-foreground",
  not_available: "bg-destructive text-destructive-foreground",
  closed: "bg-muted text-muted-foreground",
};

const statusKey = (s: Status): "pending" | "in_progress" | "partially_dispensed" | "dispensed_status" | "not_available" | "closed_status" =>
  s === "dispensed" ? "dispensed_status" : s === "closed" ? "closed_status" : s;

function VisitsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const close = useServerFn(closeVisit);
  const canCreate = user?.role === "admin" || user?.role === "doctor";
  const [rows, setRows] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("visits")
      .select("id, patient_id, status, priority, diagnosis, notes, created_at, patients(full_name, military_number)")
      .order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as Visit[]); setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("visits")}</h1>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              <SelectItem value="pending">{t("pending")}</SelectItem>
              <SelectItem value="in_progress">{t("in_progress")}</SelectItem>
              <SelectItem value="partially_dispensed">{t("partially_dispensed")}</SelectItem>
              <SelectItem value="dispensed">{t("dispensed")}</SelectItem>
              <SelectItem value="closed">{t("closed_status")}</SelectItem>
            </SelectContent>
          </Select>
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("newVisit")}</Button></DialogTrigger>
              <NewVisitDialog onSaved={() => { setOpen(false); load(); }} />
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-4 w-4" />{t("visits")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div>
            : rows.length === 0 ? <div className="p-6 text-sm text-muted-foreground">{t("noResults")}</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-start">{t("patient")}</th>
                      <th className="px-4 py-3 text-start">{t("diagnosis")}</th>
                      <th className="px-4 py-3 text-start">{t("priority")}</th>
                      <th className="px-4 py-3 text-start">{t("status")}</th>
                      <th className="px-4 py-3 text-end">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((v) => (
                      <tr key={v.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <div className="font-medium">{v.patients?.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{v.patients?.military_number}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{v.diagnosis || "—"}</td>
                        <td className="px-4 py-3"><Badge className={priorityColor[v.priority]}>{t(v.priority)}</Badge></td>
                        <td className="px-4 py-3"><Badge className={statusColor[v.status]}>{t(statusKey(v.status))}</Badge></td>
                        <td className="px-4 py-3 text-end">
                          {v.status !== "closed" && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={async () => {
                                try { await close({ data: { visit_id: v.id } }); toast.success(t("visitClosed")); load(); }
                                catch (e) { toast.error((e as Error).message); }
                              }}><CheckCircle2 className="h-3.5 w-3.5 me-1" />{t("closeVisit")}</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

type RxItem = { medicine_id: string; quantity: number; unit: "pill" | "strip" | "box"; notes?: string };

function NewVisitDialog({ onSaved }: { onSaved: () => void }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [patients, setPatients] = useState<{ id: string; full_name: string; military_number: string }[]>([]);
  const [meds, setMeds] = useState<{ id: string; name: string }[]>([]);
  const [patient_id, setPatientId] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<RxItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("patients").select("id, full_name, military_number").order("full_name").limit(500)
      .then(({ data }) => setPatients(data ?? []));
    supabase.from("medicines").select("id, name").order("name").limit(500)
      .then(({ data }) => setMeds(data ?? []));
  }, []);

  const addItem = () => setItems((s) => [...s, { medicine_id: meds[0]?.id ?? "", quantity: 1, unit: "pill" }]);
  const update = (i: number, patch: Partial<RxItem>) => setItems((s) => s.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const remove = (i: number) => setItems((s) => s.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient_id) return toast.error(t("selectPatient"));
    setBusy(true);
    const { data: visit, error: vErr } = await supabase.from("visits").insert({
      patient_id, priority, diagnosis: diagnosis || null, notes: notes || null,
      doctor_id: user?.id ?? null, status: items.length > 0 ? "in_progress" : "pending",
    }).select("id").single();
    if (vErr || !visit) { setBusy(false); return toast.error(vErr?.message ?? "Failed"); }

    if (items.length > 0) {
      const { data: rx, error: rxErr } = await supabase.from("prescriptions").insert({ visit_id: visit.id }).select("id").single();
      if (rxErr || !rx) { setBusy(false); return toast.error(rxErr?.message ?? "Failed"); }
      const valid = items.filter((it) => it.medicine_id && it.quantity > 0);
      if (valid.length > 0) {
        const { error: piErr } = await supabase.from("prescription_items").insert(
          valid.map((it) => ({ prescription_id: rx.id, medicine_id: it.medicine_id, quantity: it.quantity, unit: it.unit, notes: it.notes || null })),
        );
        if (piErr) { setBusy(false); return toast.error(piErr.message); }
      }
    }
    setBusy(false); toast.success(t("created")); onSaved();
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{t("newVisit")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pe-1">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("patient")}</Label>
            <Select value={patient_id} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder={t("selectPatient")} /></SelectTrigger>
              <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name} — {p.military_number}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("priority")}</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["low","medium","high","urgent"] as Priority[]).map((p) => <SelectItem key={p} value={p}>{t(p)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>{t("diagnosis")}</Label><Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>{t("patientNotes")}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <Label>{t("prescription")}</Label>
            <Button type="button" size="sm" variant="outline" onClick={addItem} disabled={meds.length === 0}><Plus className="h-3.5 w-3.5 me-1" />{t("addItem")}</Button>
          </div>
          {items.length === 0 ? <p className="text-xs text-muted-foreground">—</p>
            : items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-6">
                  <Select value={it.medicine_id} onValueChange={(v) => update(i, { medicine_id: v })}>
                    <SelectTrigger><SelectValue placeholder={t("selectMedicine")} /></SelectTrigger>
                    <SelectContent>{meds.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input className="col-span-3" type="number" min={1} value={it.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
                <div className="col-span-2">
                  <Select value={it.unit} onValueChange={(v) => update(i, { unit: v as RxItem["unit"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pill">{t("pill")}</SelectItem>
                      <SelectItem value="strip">{t("strip")}</SelectItem>
                      <SelectItem value="box">{t("box")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" size="icon" variant="ghost" className="col-span-1" onClick={() => remove(i)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
        </div>

        <DialogFooter><Button type="submit" disabled={busy}>{busy ? "…" : t("save")}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
