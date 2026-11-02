"use client";

import { createClient } from "@/lib/supabase/client";

const TYPES: Record<string, string> = { "image/svg+xml": "svg", "image/png": "png", "image/webp": "webp" };

// Uploads a new icon for a skill and points the skill to it. Returns an error message or null.
export async function uploadSkillIcon(skillId: number, file: File): Promise<string | null> {
  const ext = TYPES[file.type];
  if (!ext) return "El ícono debe ser SVG (recomendado), PNG o WebP.";
  if (file.size > 256 * 1024) return "El ícono supera los 256 KB.";
  const supabase = createClient();
  const path = `${skillId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("skill-icons").upload(path, file, { contentType: file.type });
  if (error) return "No se pudo subir el ícono.";
  const { error: updateError } = await supabase.from("skills").update({ icon_path: path }).eq("id", skillId);
  return updateError ? "El ícono se subió, pero no se pudo asignar a la habilidad." : null;
}
