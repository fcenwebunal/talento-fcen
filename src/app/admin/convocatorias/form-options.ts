import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function formOptions() {
  const supabase = await createClient();
  const [{ data: programs }, { data: skills }, { data: companies }, { data: setting }] = await Promise.all([
    supabase.from("programs").select("id, name").eq("level", "pregrado").eq("active", true).order("sort"),
    supabase.from("skills").select("id, name, skill_domains(name, sort)").eq("active", true).eq("status", "approved").order("name"),
    supabase.from("companies").select("id, name, logo_path").in("status", ["registrada", "en_revision", "autorizada"]).order("name"),
    supabase.from("app_settings").select("value").eq("key", "call_min_progress").maybeSingle(),
  ]);

  type SkillRow = { id: number; name: string; skill_domains: { name: string; sort: number } | null };
  return {
    programs: programs ?? [],
    skills: ((skills ?? []) as unknown as SkillRow[])
      .sort((a, b) => (a.skill_domains?.sort ?? 0) - (b.skill_domains?.sort ?? 0))
      .map((s) => ({ id: s.id, name: s.name, domain: s.skill_domains?.name ?? "Otras" })),
    companies: (companies ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      logo_url: c.logo_path ? supabase.storage.from("logos").getPublicUrl(c.logo_path).data.publicUrl : null,
    })),
    defaultMinProgress: Number(setting?.value ?? 75),
  };
}
