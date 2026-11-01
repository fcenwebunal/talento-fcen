"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";

export async function requestAuthorization() {
  await requireRole(["company"]);
  const supabase = await createClient();
  await supabase.rpc("request_company_authorization");
  revalidatePath("/empresa");
}

export async function toggleFavorite(studentId: string, isFavorite: boolean) {
  const session = await requireRole(["company"]);
  if (!session.company) return;
  const supabase = await createClient();
  if (isFavorite) {
    await supabase.from("favorites").delete().eq("company_id", session.company.id).eq("student_id", studentId);
  } else {
    await supabase.from("favorites").insert({ company_id: session.company.id, student_id: studentId });
  }
  revalidatePath("/empresa/favoritos");
  revalidatePath(`/empresa/estudiantes/${studentId}`);
}
