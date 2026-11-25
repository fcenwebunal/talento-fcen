"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";

export type RequirementChange = { key: string; required: boolean; min: number | null };

export async function saveRequirements(items: RequirementChange[]): Promise<{ ok: boolean; message: string }> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_profile_requirements", { p_items: items });
  if (error) {
    return { ok: false, message: /ADMIN_ONLY/.test(error.message) ? "Solo un administrador cambia lo obligatorio." : "No se pudo guardar. Inténtalo de nuevo." };
  }
  revalidatePath("/admin/hoja-de-vida");
  revalidatePath("/admin/estudiantes");
  revalidatePath("/admin");
  const n = Number(data ?? 0);
  return { ok: true, message: n ? `Guardado: ${n === 1 ? "1 cambio" : `${n} cambios`}.` : "No había cambios por guardar." };
}
