import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const USERNAME_DOMAIN = "clinic.local";
const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@${USERNAME_DOMAIN}`;

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

const usernameSchema = z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/, "Invalid username");
const passwordSchema = z.string().min(6).max(72);
const roleSchema = z.enum(["admin", "doctor", "pharmacist"]);

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, full_name, is_active, last_login_at, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const rolesByUser = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    return (profiles ?? []).map((p) => ({ ...p, role: rolesByUser.get(p.id) ?? null }));
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      username: usernameSchema,
      password: passwordSchema,
      full_name: z.string().trim().min(1).max(120),
      role: roleSchema,
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const email = usernameToEmail(data.username);

    const { data: existing } = await supabaseAdmin
      .from("profiles").select("id").eq("username", data.username.toLowerCase()).maybeSingle();
    if (existing) throw new Error("Username already exists");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: data.password, email_confirm: true,
      user_metadata: { username: data.username.toLowerCase(), full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Failed to create user");

    const uid = created.user.id;
    const { error: pErr } = await supabaseAdmin.from("profiles").insert({
      id: uid, username: data.username.toLowerCase(), full_name: data.full_name, is_active: true,
    });
    if (pErr) {
      await supabaseAdmin.auth.admin.deleteUser(uid);
      throw new Error(pErr.message);
    }
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role });
    if (rErr) throw new Error(rErr.message);
    return { id: uid };
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      user_id: z.string().uuid(),
      full_name: z.string().trim().min(1).max(120).optional(),
      role: roleSchema.optional(),
      is_active: z.boolean().optional(),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.full_name !== undefined || data.is_active !== undefined) {
      const patch: Record<string, unknown> = {};
      if (data.full_name !== undefined) patch.full_name = data.full_name;
      if (data.is_active !== undefined) patch.is_active = data.is_active;
      const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.user_id);
      if (error) throw new Error(error.message);
    }
    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.user_id, role: data.role });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ user_id: z.string().uuid(), new_password: passwordSchema }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { password: data.new_password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
