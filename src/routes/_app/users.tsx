import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsers, adminCreateUser, adminUpdateUser, adminResetPassword } from "@/lib/users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Plus, KeyRound, Power } from "lucide-react";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

type Row = { id: string; username: string; full_name: string; is_active: boolean; role: string | null; last_login_at: string | null };

function UsersPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const list = useServerFn(adminListUsers);
  const create = useServerFn(adminCreateUser);
  const update = useServerFn(adminUpdateUser);
  const reset = useServerFn(adminResetPassword);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [resetFor, setResetFor] = useState<Row | null>(null);

  const reload = async () => {
    setLoading(true);
    try { setRows((await list()) as Row[]); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  if (user?.role !== "admin") {
    return <div className="text-sm text-muted-foreground">Admins only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("users")}</h1>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 me-1" />{t("addUser")}</Button>
          </DialogTrigger>
          <CreateDialog onCreated={() => { setOpenCreate(false); reload(); }} create={create} />
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("users")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">{t("noResults")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-start text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start">{t("username")}</th>
                    <th className="px-4 py-3 text-start">{t("fullName")}</th>
                    <th className="px-4 py-3 text-start">{t("role")}</th>
                    <th className="px-4 py-3 text-start">{t("active")}</th>
                    <th className="px-4 py-3 text-end">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{r.username}</td>
                      <td className="px-4 py-3">{r.full_name}</td>
                      <td className="px-4 py-3">
                        <RoleSelect
                          value={r.role ?? "doctor"}
                          disabled={r.id === user.id}
                          onChange={async (role) => {
                            try { await update({ data: { user_id: r.id, role } }); toast.success(t("updated")); reload(); }
                            catch (e) { toast.error((e as Error).message); }
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {r.is_active ? <Badge>{t("active")}</Badge> : <Badge variant="destructive">{t("disabled")}</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setResetFor(r)}>
                            <KeyRound className="h-3.5 w-3.5 me-1" />{t("resetPassword")}
                          </Button>
                          <Button
                            size="sm" variant={r.is_active ? "outline" : "default"}
                            disabled={r.id === user.id}
                            onClick={async () => {
                              try { await update({ data: { user_id: r.id, is_active: !r.is_active } }); toast.success(t("updated")); reload(); }
                              catch (e) { toast.error((e as Error).message); }
                            }}
                          >
                            <Power className="h-3.5 w-3.5 me-1" />
                            {r.is_active ? t("disable") : t("enable")}
                          </Button>
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

      <ResetDialog target={resetFor} onClose={() => setResetFor(null)} reset={reset} />
    </div>
  );
}

function RoleSelect({ value, onChange, disabled }: { value: string; onChange: (r: "admin"|"doctor"|"pharmacist") => void; disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <Select value={value} onValueChange={(v) => onChange(v as "admin"|"doctor"|"pharmacist")} disabled={disabled}>
      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">{t("role_admin")}</SelectItem>
        <SelectItem value="doctor">{t("role_doctor")}</SelectItem>
        <SelectItem value="pharmacist">{t("role_pharmacist")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

function CreateDialog({ create, onCreated }: { create: (args: { data: { username: string; password: string; full_name: string; role: "admin"|"doctor"|"pharmacist" } }) => Promise<unknown>; onCreated: () => void }) {
  const { t } = useI18n();
  const [username, setU] = useState(""); const [password, setP] = useState("");
  const [fullName, setF] = useState(""); const [role, setR] = useState<"admin"|"doctor"|"pharmacist">("doctor");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await create({ data: { username, password, full_name: fullName, role } }); toast.success(t("created")); onCreated(); setU(""); setP(""); setF(""); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{t("addUser")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5"><Label>{t("username")}</Label><Input value={username} onChange={(e) => setU(e.target.value)} required minLength={3} /></div>
        <div className="space-y-1.5"><Label>{t("fullName")}</Label><Input value={fullName} onChange={(e) => setF(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>{t("password")}</Label><Input type="password" value={password} onChange={(e) => setP(e.target.value)} required minLength={6} /></div>
        <div className="space-y-1.5"><Label>{t("role")}</Label>
          <Select value={role} onValueChange={(v) => setR(v as "admin"|"doctor"|"pharmacist")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">{t("role_admin")}</SelectItem>
              <SelectItem value="doctor">{t("role_doctor")}</SelectItem>
              <SelectItem value="pharmacist">{t("role_pharmacist")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter><Button type="submit" disabled={busy}>{busy ? "…" : t("save")}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}

function ResetDialog({ target, onClose, reset }: { target: Row | null; onClose: () => void; reset: (args: { data: { user_id: string; new_password: string } }) => Promise<unknown> }) {
  const { t } = useI18n();
  const [pw, setPw] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && (onClose(), setPw(""))}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("resetPassword")} — {target?.username}</DialogTitle></DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault(); if (!target) return; setBusy(true);
            try { await reset({ data: { user_id: target.id, new_password: pw } }); toast.success(t("updated")); onClose(); setPw(""); }
            catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5"><Label>{t("newPassword")}</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} /></div>
          <DialogFooter><Button type="submit" disabled={busy}>{busy ? "…" : t("confirm")}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
