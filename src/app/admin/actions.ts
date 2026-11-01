"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import type { Availability, CompanyStatus, Role } from "@/lib/types";

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
  await supabase
    .from("students")
    .update({
      progress_pct: pct === null || pct === "" ? null : Number(pct),
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

export async function setRole(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const role = String(formData.get("role")) as Role;
  if (!["student", "staff", "admin"].includes(role)) return;
  await supabase.from("profiles").update({ role }).eq("id", String(formData.get("user_id")));
  revalidatePath("/admin/usuarios");
}
