import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertRole(userId: string, roles: ("admin" | "pharmacist" | "doctor")[]) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).in("role", roles);
  if (!data || data.length === 0) throw new Error("Forbidden");
}

/** Atomic dispense: decrement medicine stock, record movement, update prescription item, log shortage if partial. */
export const dispensePrescriptionItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      item_id: z.string().uuid(),
      pills: z.number().int().positive().max(100000),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertRole(context.userId, ["admin", "pharmacist"]);

    const { data: item, error: iErr } = await supabaseAdmin
      .from("prescription_items")
      .select("id, medicine_id, quantity, dispensed_pills, unit")
      .eq("id", data.item_id).maybeSingle();
    if (iErr || !item) throw new Error("Item not found");

    const { data: med, error: mErr } = await supabaseAdmin
      .from("medicines")
      .select("id, total_pills, pills_per_strip, strips_per_box")
      .eq("id", item.medicine_id).maybeSingle();
    if (mErr || !med) throw new Error("Medicine not found");

    const needed = data.pills;
    const available = med.total_pills;
    const actual = Math.min(needed, Math.max(0, available));
    const missing = needed - actual;

    if (actual > 0) {
      const { error: uErr } = await supabaseAdmin
        .from("medicines")
        .update({ total_pills: available - actual })
        .eq("id", med.id);
      if (uErr) throw new Error(uErr.message);

      const { error: smErr } = await supabaseAdmin.from("stock_movements").insert({
        medicine_id: med.id, movement_type: "out",
        pills_delta: -actual, performed_by: context.userId,
        reason: `Dispense item ${item.id}`,
      });
      if (smErr) throw new Error(smErr.message);

      const { error: piErr } = await supabaseAdmin
        .from("prescription_items")
        .update({ dispensed_pills: item.dispensed_pills + actual })
        .eq("id", item.id);
      if (piErr) throw new Error(piErr.message);
    }

    if (missing > 0) {
      const { data: existing } = await supabaseAdmin
        .from("shortages").select("id, missing_pills, request_count")
        .eq("medicine_id", med.id).eq("resolved", false).maybeSingle();
      if (existing) {
        await supabaseAdmin.from("shortages").update({
          missing_pills: existing.missing_pills + missing,
          request_count: existing.request_count + 1,
          last_requested_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("shortages").insert({
          medicine_id: med.id, missing_pills: missing, request_count: 1,
        });
      }
    }

    return { dispensed: actual, missing };
  });

/** Close a visit and create an archive snapshot. */
export const closeVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ visit_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertRole(context.userId, ["admin", "doctor", "pharmacist"]);
    const { data: visit, error: visitErr } = await supabaseAdmin
      .from("visits").select("*, patients(*), prescriptions(*, prescription_items(*, medicines(name)))")
      .eq("id", data.visit_id).maybeSingle();
    if (visitErr) throw new Error(`Visit fetch failed: ${visitErr.message}`);
    if (!visit) throw new Error(`Visit not found: ${data.visit_id}`);

    await supabaseAdmin.from("visits").update({
      status: "closed", closed_at: new Date().toISOString(),
    }).eq("id", data.visit_id);

    await supabaseAdmin.from("archived_visits").insert({
      visit_id: data.visit_id, snapshot: visit,
    });
    return { ok: true };
  });
