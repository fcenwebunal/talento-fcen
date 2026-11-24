"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { applyError } from "@/lib/calls";

export type ApplyState = { ok: boolean; message: string } | null;

// The database (apply_to_call) checks the role, the deadline, the minimum CV and the academic requirements
export async function applyToCall(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  await requireRole(["student"]);
  const callId = String(formData.get("call_id"));
  if (formData.get("consent") !== "on") return { ok: false, message: "Acepta la autorización para compartir tu hoja de vida." };
  const message = String(formData.get("message") ?? "").trim().slice(0, 1500);
  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_to_call", { p_call: callId, p_message: message || null });
  if (error) return { ok: false, message: applyError(error.message) };
  revalidatePath(`/convocatorias/${callId}`);
  revalidatePath("/estudiante/postulaciones");
  return { ok: true, message: "Tu postulación quedó registrada. La Facultad la revisará y te contará cómo avanza." };
}

export async function withdrawApplication(formData: FormData) {
  await requireRole(["student"]);
  const callId = String(formData.get("call_id"));
  const supabase = await createClient();
  await supabase.rpc("withdraw_application", { p_call: callId });
  revalidatePath(`/convocatorias/${callId}`);
  revalidatePath("/estudiante/postulaciones");
}
