"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import type { Availability } from "@/lib/types";

const STUDENT_CHOICES: Availability[] = ["disponible", "en_proceso", "en_practica", "no_disponible"];

export async function confirmAvailability() {
  await requireRole(["student"]);
  const supabase = await createClient();
  await supabase.rpc("confirm_availability");
  revalidatePath("/estudiante");
}

export async function setAvailability(formData: FormData) {
  const session = await requireRole(["student"]);
  const value = String(formData.get("availability")) as Availability;
  if (!STUDENT_CHOICES.includes(value)) return;
  const practiceEnd = String(formData.get("practice_end_date") ?? "") || null;
  const supabase = await createClient();
  await supabase
    .from("students")
    .update({ availability: value, practice_end_date: value === "en_practica" ? practiceEnd : null })
    .eq("id", session.userId);
  revalidatePath("/estudiante");
}
