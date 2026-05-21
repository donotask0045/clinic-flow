import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { closeVisit, deleteVisit } from "@/lib/clinic.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Stethoscope, X, CheckCircle2, ChevronsUpDown, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/visits")({ component: VisitsPage });

type Status = "pending" | "in_progress" | "partially_dispensed" | "dispensed" | "not_available" | "closed";
type Visit = {
  id: string; patient_id: string; status: Status; created_at: string;
  patients: { full_name: string; military_number: string } | null;
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
  const del = useServerFn(deleteVisit);
  const canCreate = user?.role === "admin" || user?.role === "doctor";
  const canDelete = user?.role === "admin";
  const [rows, setRows] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Visit | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("visits")
      .select("id, patient_id, status, created_at, patients(full_name, military_number)")
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
                        <td className="px-4 py-3"><Badge className={statusColor[v.status]}>{t(statusKey(v.status))}</Badge></td>
                        <td className="px-4 py-3 text-end">
                          <div className="flex justify-end gap-2">
                            {v.status !== "closed" && (
                              <Button size="sm" variant="outline" onClick={async () => {
                                try { await close({ data: { visit_id: v.id } }); toast.success(t("visitClosed")); load(); }
                                catch (e) { toast.error((e as Error).message); }
                              }}><CheckCircle2 className="h-3.5 w-3.5 me-1" />{t("closeVisit")}</Button>
                            )}
                            {canDelete && (
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setToDelete(v)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirmDeleteVisit")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("close")}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!toDelete) return;
              try { await del({ data: { visit_id: toDelete.id } }); toast.success(t("deleted")); setToDelete(null); load(); }
              catch (e) { toast.error((e as Error).message); }
            }}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type Unit = "pill" | "strip" | "box" | "injection" | "syrup" | "ointment" | "ampoule" | "tube";
type RxItem = { medicine_id: string; quantity: number; unit: Unit; notes?: string };
type PatientOpt = { id: string; full_name: string; military_number: string };
type MedOpt = { id: string; name: string; commercial_name: string | null; category: string | null; form: string };

function unitsForForm(form: string): Unit[] {
  switch (form) {
    case "tablet": return ["pill", "strip", "box"];
    case "ointment": return ["ointment", "tube", "box"];
    case "syrup": return ["syrup", "box"];
    case "injection": return ["injection", "ampoule", "box"];
    default: return ["box"];
  }
}

function defaultUnitFor(form: string): Unit {
  return unitsForForm(form)[0];
}

function NewVisitDialog({ onSaved }: { onSaved: () => void }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [meds, setMeds] = useState<MedOpt[]>([]);
  const [patient_id, setPatientId] = useState("");
  const [items, setItems] = useState<RxItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("patients").select("id, full_name, military_number").order("full_name").limit(2000)
      .then(({ data }) => setPatients((data ?? []) as PatientOpt[]));
    supabase.from("medicines").select("id, name, commercial_name, category, form").order("name").limit(2000)
      .then(({ data }) => setMeds((data ?? []) as MedOpt[]));
  }, []);

  const update = (i: number, patch: Partial<RxItem>) => setItems((s) => s.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const remove = (i: number) => setItems((s) => s.filter((_, idx) => idx !== i));
  const addMedicine = (m: MedOpt) => {
    if (items.some((it) => it.medicine_id === m.id)) return;
    setItems((s) => [...s, { medicine_id: m.id, quantity: 1, unit: defaultUnitFor(m.form) }]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient_id) return toast.error(t("selectPatient"));
    setBusy(true);
    const { data: visit, error: vErr } = await supabase.from("visits").insert({
      patient_id, doctor_id: user?.id ?? null,
      status: items.length > 0 ? "in_progress" : "pending",
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

  const selectedPatient = patients.find((p) => p.id === patient_id);
  const medsById = new Map(meds.map((m) => [m.id, m]));
  const groupedMeds = meds.reduce<Record<string, MedOpt[]>>((acc, m) => {
    const k = m.category?.trim() || t("uncategorized");
    (acc[k] ??= []).push(m);
    return acc;
  }, {});
  const groupKeys = Object.keys(groupedMeds).sort();

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{t("newVisit")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4 max-h-[70vh] overflow-y-auto pe-1">
        <div className="space-y-1.5">
          <Label>{t("patient")}</Label>
          <PatientPicker patients={patients} value={patient_id} onChange={setPatientId} selected={selectedPatient} />
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <Label>{t("prescription")}</Label>
            <MedicinePicker grouped={groupedMeds} groupKeys={groupKeys} onPick={addMedicine} disabledIds={new Set(items.map((i) => i.medicine_id))} />
          </div>
          {items.length === 0 ? <p className="text-xs text-muted-foreground">—</p>
            : items.map((it, i) => {
              const m = medsById.get(it.medicine_id);
              const units = unitsForForm(m?.form ?? "tablet");
              return (
                <div key={i} className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-6 truncate text-sm">
                    <div className="font-medium truncate">{m?.name ?? "—"}</div>
                    {m?.category && <div className="text-xs text-muted-foreground truncate">{m.category}</div>}
                  </div>
                  <Input className="col-span-3" type="number" min={1} value={it.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
                  <div className="col-span-2">
                    <Select value={it.unit} onValueChange={(v) => update(i, { unit: v as Unit })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {units.map((u) => <SelectItem key={u} value={u}>{t(u)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" size="icon" variant="ghost" className="col-span-1" onClick={() => remove(i)}><X className="h-4 w-4" /></Button>
                </div>
              );
            })}
        </div>

        <DialogFooter><Button type="submit" disabled={busy}>{busy ? "…" : t("save")}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}

function PatientPicker({ patients, value, onChange, selected }:
  { patients: PatientOpt[]; value: string; onChange: (id: string) => void; selected?: PatientOpt }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" className="w-full justify-between">
          {selected ? `${selected.full_name} — ${selected.military_number}` : t("selectPatient")}
          <ChevronsUpDown className="h-4 w-4 opacity-50 ms-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command filter={(v, search) => v.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
          <CommandInput placeholder={t("searchPatient")} />
          <CommandList>
            <CommandEmpty>{t("noResults")}</CommandEmpty>
            <CommandGroup>
              {patients.map((p) => (
                <CommandItem key={p.id} value={`${p.full_name} ${p.military_number}`}
                  onSelect={() => { onChange(p.id); setOpen(false); }}>
                  <Check className={cn("h-4 w-4 me-2", value === p.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{p.full_name}</span>
                  <span className="ms-auto text-xs text-muted-foreground">{p.military_number}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function MedicinePicker({ grouped, groupKeys, onPick, disabledIds }:
  { grouped: Record<string, MedOpt[]>; groupKeys: string[]; onPick: (m: MedOpt) => void; disabledIds: Set<string> }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Plus className="h-3.5 w-3.5 me-1" />{t("addItem")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        <Command filter={(v, search) => v.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
          <CommandInput placeholder={t("searchMedicine")} />
          <CommandList className="max-h-[320px]">
            <CommandEmpty>{t("noResults")}</CommandEmpty>
            {groupKeys.map((g) => (
              <CommandGroup key={g} heading={g}>
                {grouped[g].map((m) => (
                  <CommandItem key={m.id} value={`${m.name} ${m.commercial_name ?? ""} ${m.category ?? ""}`}
                    disabled={disabledIds.has(m.id)}
                    onSelect={() => { onPick(m); setOpen(false); }}>
                    <span className="truncate">{m.name}</span>
                    {m.commercial_name && <span className="ms-2 truncate text-xs text-muted-foreground">{m.commercial_name}</span>}
                    <span className="ms-auto text-xs text-muted-foreground">{t(m.form as "formTablet") || m.form}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
