import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { deleteMedicine } from "@/lib/clinic.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Boxes, ArrowDownToLine, Search, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/inventory")({ component: InventoryPage });

type Status = "available" | "low_stock" | "out_of_stock" | "expired";
type Form = "tablet" | "ointment" | "syrup" | "injection" | "other";
type Medicine = {
  id: string; name: string; commercial_name: string | null; barcode: string | null;
  description: string | null; pills_per_strip: number; strips_per_box: number;
  minimum_pills: number; total_pills: number; expiry_date: string | null; status: Status;
  form: Form; category: string | null;
};

const statusBadge: Record<Status, string> = {
  available: "bg-success/20 text-success-foreground",
  low_stock: "bg-warning/20 text-warning-foreground",
  out_of_stock: "bg-destructive text-destructive-foreground",
  expired: "bg-destructive text-destructive-foreground",
};

function InventoryPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const canWrite = user?.role === "admin" || user?.role === "pharmacist";
  const del = useServerFn(deleteMedicine);
  const [rows, setRows] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [moving, setMoving] = useState<Medicine | null>(null);
  const [toDelete, setToDelete] = useState<Medicine | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase.from("medicines").select("*").order("name").limit(500);
    if (q.trim()) query = query.or(`name.ilike.%${q}%,commercial_name.ilike.%${q}%,barcode.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRows((data ?? []) as Medicine[]); setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("inventory")}</h1>
        {canWrite && (
          <Dialog open={openEdit} onOpenChange={(o) => { setOpenEdit(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 me-1" />{t("addMedicine")}</Button>
            </DialogTrigger>
            <MedicineDialog editing={editing} onSaved={() => { setOpenEdit(false); setEditing(null); load(); }} />
          </Dialog>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t("search")} (${t("barcode")}…)`} className="ps-9" />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Boxes className="h-4 w-4" />{t("inventory")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div>
            : rows.length === 0 ? <div className="p-6 text-sm text-muted-foreground">{t("noResults")}</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-start">{t("medicine")}</th>
                      <th className="px-4 py-3 text-start">{t("barcode")}</th>
                      <th className="px-4 py-3 text-start">{t("totalPills")}</th>
                      <th className="px-4 py-3 text-start">{t("status")}</th>
                      <th className="px-4 py-3 text-start">{t("expiryDate")}</th>
                      <th className="px-4 py-3 text-end">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((m) => (
                      <tr key={m.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <div className="font-medium">{m.name}</div>
                          {m.commercial_name && <div className="text-xs text-muted-foreground">{m.commercial_name}</div>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{m.barcode || "—"}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {m.total_pills} <span className="text-xs text-muted-foreground">/ {m.minimum_pills} {t(formUnitKey(m.form))}</span>
                        </td>
                        <td className="px-4 py-3"><Badge className={statusBadge[m.status]}>{t(statusKey(m.status))}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">{m.expiry_date || "—"}</td>
                        <td className="px-4 py-3 text-end">
                          {canWrite && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setMoving(m)}><ArrowDownToLine className="h-3.5 w-3.5 me-1" />{t("stockMovement")}</Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditing(m); setOpenEdit(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setToDelete(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

      <MovementDialog target={moving} onClose={() => setMoving(null)} onSaved={() => { setMoving(null); load(); }} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirmDeleteMedicine")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("close")}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!toDelete) return;
              try { await del({ data: { medicine_id: toDelete.id } }); toast.success("Deleted"); setToDelete(null); load(); }
              catch (e) { toast.error((e as Error).message); }
            }}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

function statusKey(s: Status): "available" | "lowStockLabel" | "outOfStock" | "expiredLabel" {
  return s === "available" ? "available" : s === "low_stock" ? "lowStockLabel" : s === "out_of_stock" ? "outOfStock" : "expiredLabel";
}

function formUnitKey(f: Form): "pill" | "box" {
  return f === "tablet" ? "pill" : "box";
}

function CategoryDatalist() {
  const [cats, setCats] = useState<string[]>([]);
  useEffect(() => {
    supabase.from("medicines").select("category").not("category", "is", null).limit(500)
      .then(({ data }) => {
        const uniq = Array.from(new Set((data ?? []).map((r: { category: string | null }) => r.category).filter(Boolean) as string[]));
        setCats(uniq.sort());
      });
  }, []);
  return <datalist id="medicine-categories">{cats.map((c) => <option key={c} value={c} />)}</datalist>;
}

function MedicineDialog({ editing, onSaved }: { editing: Medicine | null; onSaved: () => void }) {
  const { t } = useI18n();
  const init: Partial<Medicine> = { form: "tablet", pills_per_strip: 10, strips_per_box: 1, minimum_pills: 0, total_pills: 0 };
  const [f, setF] = useState<Partial<Medicine>>(editing ?? init);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setF(editing ?? init); /* eslint-disable-next-line */ }, [editing]);

  const isTablet = (f.form ?? "tablet") === "tablet";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (f.name ?? "").trim();
    if (!name) return toast.error("Name required");
    setBusy(true);
    const payload = {
      name, commercial_name: f.commercial_name || null, barcode: f.barcode || null,
      description: f.description || null,
      form: f.form ?? "tablet",
      category: (f.category ?? "").trim() || null,
      pills_per_strip: isTablet ? Number(f.pills_per_strip ?? 1) : 1,
      strips_per_box: isTablet ? Number(f.strips_per_box ?? 1) : 1,
      minimum_pills: Number(f.minimum_pills ?? 0),
      total_pills: Number(f.total_pills ?? 0),
      expiry_date: f.expiry_date || null,
    };
    const { error } = editing
      ? await supabase.from("medicines").update(payload as never).eq("id", editing.id)
      : await supabase.from("medicines").insert(payload as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? t("updated") : t("created")); onSaved();
  };

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>{editing ? t("editMedicine") : t("addMedicine")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pe-1">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5"><Label>{t("medicine")}</Label><Input required value={f.name ?? ""} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{t("commercialName")}</Label><Input value={f.commercial_name ?? ""} onChange={(e) => setF({ ...f, commercial_name: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>{t("form")}</Label>
            <Select value={f.form ?? "tablet"} onValueChange={(v) => setF({ ...f, form: v as Form })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tablet">{t("formTablet")}</SelectItem>
                <SelectItem value="ointment">{t("formOintment")}</SelectItem>
                <SelectItem value="syrup">{t("formSyrup")}</SelectItem>
                <SelectItem value="injection">{t("formInjection")}</SelectItem>
                <SelectItem value="other">{t("formOther")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{t("barcode")}</Label><Input value={f.barcode ?? ""} onChange={(e) => setF({ ...f, barcode: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{t("expiryDate")}</Label><Input type="date" value={f.expiry_date ?? ""} onChange={(e) => setF({ ...f, expiry_date: e.target.value })} /></div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>{t("category")}</Label>
            <Input list="medicine-categories" value={f.category ?? ""} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder={t("category")} />
            <CategoryDatalist />
          </div>
          {isTablet && (
            <>
              <div className="space-y-1.5"><Label>{t("pillsPerStrip")}</Label><Input type="number" min={1} value={f.pills_per_strip ?? 1} onChange={(e) => setF({ ...f, pills_per_strip: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>{t("stripsPerBox")}</Label><Input type="number" min={1} value={f.strips_per_box ?? 1} onChange={(e) => setF({ ...f, strips_per_box: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>{t("totalPills")}</Label><Input type="number" min={0} value={f.total_pills ?? 0} onChange={(e) => setF({ ...f, total_pills: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>{t("minimumPills")}</Label><Input type="number" min={0} value={f.minimum_pills ?? 0} onChange={(e) => setF({ ...f, minimum_pills: Number(e.target.value) })} /></div>
            </>
          )}
          {!isTablet && (
            <>
              <div className="space-y-1.5"><Label>{t("totalUnits")} ({t("box")})</Label><Input type="number" min={0} value={f.total_pills ?? 0} onChange={(e) => setF({ ...f, total_pills: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>{t("minimumUnits")} ({t("box")})</Label><Input type="number" min={0} value={f.minimum_pills ?? 0} onChange={(e) => setF({ ...f, minimum_pills: Number(e.target.value) })} /></div>
            </>
          )}
        </div>
        <div className="space-y-1.5"><Label>{t("description")}</Label><Textarea value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} /></div>
        <DialogFooter><Button type="submit" disabled={busy}>{busy ? "…" : t("save")}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}

function MovementDialog({ target, onClose, onSaved }: { target: Medicine | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [type, setType] = useState<"in" | "out" | "adjustment">("in");
  const [pills, setPills] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (target) { setType("in"); setPills(0); setReason(""); } }, [target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!target) return; setBusy(true);
    let delta = 0;
    let newTotal = target.total_pills;
    if (type === "in") { delta = pills; newTotal = target.total_pills + pills; }
    else if (type === "out") { delta = -pills; newTotal = Math.max(0, target.total_pills - pills); }
    else { delta = pills - target.total_pills; newTotal = pills; }

    const { error: uErr } = await supabase.from("medicines").update({ total_pills: newTotal }).eq("id", target.id);
    if (uErr) { setBusy(false); return toast.error(uErr.message); }
    const { error: smErr } = await supabase.from("stock_movements").insert({
      medicine_id: target.id, movement_type: type, pills_delta: delta, reason: reason || null,
    });
    setBusy(false);
    if (smErr) return toast.error(smErr.message);
    toast.success(t("updated")); onSaved();
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("stockMovement")} — {target?.name}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5"><Label>{t("movementType")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">{t("stockIn")}</SelectItem>
                <SelectItem value="out">{t("stockOut")}</SelectItem>
                <SelectItem value="adjustment">{t("stockAdjust")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{type === "adjustment" ? t("totalPills") : t("quantity")} ({t("pill")})</Label>
            <Input type="number" min={0} value={pills} onChange={(e) => setPills(Number(e.target.value))} required />
          </div>
          <div className="space-y-1.5"><Label>{t("reason")}</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <DialogFooter><Button type="submit" disabled={busy}>{busy ? "…" : t("recordMovement")}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
