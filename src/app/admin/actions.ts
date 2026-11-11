"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { ROLE_LABEL, isRole } from "@/lib/roles";
import type { Availability, CompanyStatus } from "@/lib/types";

export async function setCompanyStatus(formData: FormData) {
  await requireRole(["staff", "admin"]);
  const supabase = await createClient();
  const id = String(formData.get("company_id"));
  const status = String(formData.get("status")) as CompanyStatus;
  const note = String(formData.get("note") ?? "").trim() || null;
  await supabase.rpc("set_company_status", { p_company: id, p_status: status, p_note: note });
  revalidatePath("/admin/empresas");
  revalidatePath(`/admin/empresas/${id}`);
}

export async function verifyProgress(formData: FormData) {
  await requireRole(["staff", "admin"]);
  const supabase = await createClient();
  const id = String(formData.get("student_id"));
  const pct = formData.get("progress_pct");
  const papa = formData.get("papa");
  await supabase
    .from("students")
    .update({
      progress_pct: pct === null || pct === "" ? null : Number(pct),
      papa: papa === null || papa === "" ? null : Number(papa),
      progress_verified: "coordinacion",
      progress_verified_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath(`/admin/estudiantes/${id}`);
}

export async function setStudentAvailability(formData: FormData) {
  await requireRole(["staff", "admin"]);
  const supabase = await createClient();
  const id = String(formData.get("student_id"));
  const availability = String(formData.get("availability")) as Availability;
  await supabase.from("students").update({ availability }).eq("id", id);
  revalidatePath(`/admin/estudiantes/${id}`);
}

export async function addSkill(formData: FormData) {
  await requireRole(["staff", "admin"]);
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const domain = Number(formData.get("domain_id"));
  if (!name || !domain) return;
  await supabase.from("skills").insert({ name, domain_id: domain });
  revalidatePath("/admin/catalogo");
}

export async function toggleSkill(formData: FormData) {
  await requireRole(["staff", "admin"]);
  const supabase = await createClient();
  await supabase
    .from("skills")
    .update({ active: formData.get("active") !== "true" })
    .eq("id", Number(formData.get("skill_id")));
  revalidatePath("/admin/catalogo");
}

export type RoleActionState = { ok: boolean; message: string } | null;

function roleError(message = "") {
  if (/ROLE_SELF/.test(message)) return "No puedes cambiar tu propio rol.";
  if (/ROLE_LAST_ADMIN/.test(message)) return "Debe quedar al menos un administrador.";
  if (/ROLE_FORBIDDEN/.test(message)) return "Solo un administrador puede asignar ese rol.";
  if (/ROLE_INVALID/.test(message)) return "Elige el rol que tendrá la cuenta.";
  if (/NOT_FOUND/.test(message)) return "La cuenta ya no existe.";
  if (/check constraint/.test(message)) return "Escribe un correo válido.";
  return "No se pudo guardar. Inténtalo de nuevo.";
}

// The database (guard_profile) decides who may make each change: administrators any, the Facultad only «usuario» to student
export async function changeRole(_prev: RoleActionState, formData: FormData): Promise<RoleActionState> {
  await requireRole(["staff", "admin"]);
  const role = formData.get("role");
  if (!isRole(role)) return { ok: false, message: "Elige un rol." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", { p_user: String(formData.get("user_id")), p_role: role });
  if (error) return { ok: false, message: roleError(error.message) };
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Ahora es ${ROLE_LABEL[role].toLowerCase()}.` };
}

export async function inviteUser(_prev: RoleActionState, formData: FormData): Promise<RoleActionState> {
  await requireRole(["admin"]);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = formData.get("role");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, message: "Escribe un correo válido." };
  if (!isRole(role) || role === "user") return { ok: false, message: "Elige el rol que tendrá la cuenta." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_user", { p_email: email, p_role: role });
  if (error) return { ok: false, message: roleError(error.message) };
  revalidatePath("/admin/usuarios");
  const label = ROLE_LABEL[role].toLowerCase();
  return {
    ok: true,
    message:
      data === "updated"
        ? `${email} ya tenía cuenta: ahora es ${label}.`
        : `${email} quedó registrado como ${label}. Tendrá ese rol la primera vez que entre con Google con ese correo.`,
  };
}

export async function deleteInvite(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  await supabase.from("role_invites").delete().eq("email", String(formData.get("email")));
  revalidatePath("/admin/usuarios");
}
