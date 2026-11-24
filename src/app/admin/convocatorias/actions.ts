"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import type { ApplicationStatus, CallStatus } from "@/lib/calls";

const APPLICATION_STATUSES: ApplicationStatus[] = ["recibida", "en_revision", "enviada", "seleccionada", "no_seleccionada", "retirada"];
const CALL_STATUSES: CallStatus[] = ["borrador", "publicada", "cerrada"];

export async function setApplicationStatus(formData: FormData) {
  await requireRole(["staff", "admin"]);
  const status = String(formData.get("status")) as ApplicationStatus;
  if (!APPLICATION_STATUSES.includes(status)) return;
  const callId = String(formData.get("call_id"));
  const supabase = await createClient();
  await supabase
    .from("applications")
    .update({ status, staff_note: String(formData.get("staff_note") ?? "").trim().slice(0, 1000) || null })
    .eq("id", Number(formData.get("application_id")));
  revalidatePath(`/admin/convocatorias/${callId}`);
  revalidatePath("/admin", "layout");
}

export async function setCallStatus(formData: FormData) {
  await requireRole(["staff", "admin"]);
  const status = String(formData.get("status")) as CallStatus;
  if (!CALL_STATUSES.includes(status)) return;
  const id = String(formData.get("call_id"));
  const supabase = await createClient();
  await supabase.from("calls").update({ status }).eq("id", id);
  revalidatePath(`/admin/convocatorias/${id}`);
  revalidatePath("/admin/convocatorias");
}

// Only drafts without applications: the database refuses to delete a call that has any (on delete restrict)
export async function deleteCall(formData: FormData) {
  await requireRole(["staff", "admin"]);
  const id = String(formData.get("call_id"));
  const supabase = await createClient();
  const { data: call } = await supabase.from("calls").select("status, logo_path").eq("id", id).maybeSingle();
  if (!call || call.status !== "borrador") return;
  const { error } = await supabase.from("calls").delete().eq("id", id);
  if (error) return;
  if (call.logo_path) await supabase.storage.from("call-logos").remove([call.logo_path]);
  revalidatePath("/admin/convocatorias");
  redirect("/admin/convocatorias");
}
