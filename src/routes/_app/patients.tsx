import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { deletePatient } from "@/lib/clinic.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Search, Users as UsersIcon, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/patients")({ component: PatientsPage });

type Patient = {
  id: string; full_name: string; military_number: string;
  other_diseases: string | null; notes: string | null; created_at: string;
};

function PatientsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const canWrite = user?.role === "admin" || user?.role === "doctor";
  const canDelete = user?.role === "admin";
  const del = useServerFn(deletePatient);
  const [rows, setRows] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Patient | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase.from("patients").select("*").order("created_at", { ascending: false }).limit(200);
    if (q.trim()) query = query.or(`full_name.ilike.%${q}%,military_number.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRows((data ?? []) as Patient[]); setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("patients")}</h1>
        {canWrite && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 me-1" />{t("addPatient")}</Button>
            </DialogTrigger>
            <PatientDialog editing={editing} onSaved={() => { setOpen(false); setEditing(null); load(); }} />
          </Dialog>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="ps-9" />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="h-4 w-4" />{t("patients")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div>
            : rows.length === 0 ? <div className="p-6 text-sm text-muted-foreground">{t("noResults")}</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-start">{t("fullName")}</th>
                      <th className="px-4 py-3 text-start">{t("militaryNumber")}</th>
                      <th className="px-4 py-3 text-start">{t("otherDiseases")}</th>
                      <th className="px-4 py-3 text-end">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{p.full_name}</td>
                        <td className="px-4 py-3">{p.military_number}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.other_diseases || "—"}</td>
                        <td className="px-4 py-3 text-end">
                          <div className="flex justify-end gap-2">
                            {canWrite && (
                              <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}>
                                <Pencil className="h-3.5 w-3.5 me-1" />{t("edit")}
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setToDelete(p)}>
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
            <AlertDialogDescription>{t("confirmDeletePatient")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("close")}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!toDelete) return;
              try { await del({ data: { patient_id: toDelete.id } }); toast.success("Deleted"); setToDelete(null); load(); }
              catch (e) { toast.error((e as Error).message); }
            }}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
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

function PatientDialog({ editing, onSaved }: { editing: Patient | null; onSaved: () => void }) {
  const { t } = useI18n();
  const [full_name, setFullName] = useState(editing?.full_name ?? "");
  const [military_number, setMilitary] = useState(editing?.military_number ?? "");
  const [other_diseases, setOther] = useState(editing?.other_diseases ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFullName(editing?.full_name ?? ""); setMilitary(editing?.military_number ?? "");
    setOther(editing?.other_diseases ?? ""); setNotes(editing?.notes ?? "");
  }, [editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const payload = { full_name: full_name.trim(), military_number: military_number.trim(), other_diseases: other_diseases || null, notes: notes || null };
    const { error } = editing
      ? await supabase.from("patients").update(payload).eq("id", editing.id)
      : await supabase.from("patients").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? t("updated") : t("created")); onSaved();
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? t("editPatient") : t("addPatient")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5"><Label>{t("fullName")}</Label><Input value={full_name} onChange={(e) => setFullName(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>{t("militaryNumber")}</Label><Input value={military_number} onChange={(e) => setMilitary(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>{t("otherDiseases")}</Label><Textarea value={other_diseases ?? ""} onChange={(e) => setOther(e.target.value)} rows={2} /></div>
        <div className="space-y-1.5"><Label>{t("patientNotes")}</Label><Textarea value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        <DialogFooter><Button type="submit" disabled={busy}>{busy ? "…" : t("save")}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
