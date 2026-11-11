// Registers the internship candidates of a CSV made by scripts/sia-candidates.py as students with their SIA data.
// New emails become invites (role student + program, progress and PAPA, applied on the first Google sign-in as verified by
// the coordination); existing «usuario» or student accounts are updated now; accounts with another role are only reported.
// Run: node --env-file=.env.local scripts/load-candidates.mjs <candidatos.csv> [--confirm]   (without --confirm it only reports)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [file] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const CONFIRM = process.argv.includes("--confirm");
if (!file) {
  console.error("Uso: node --env-file=.env.local scripts/load-candidates.mjs <candidatos.csv> [--confirm]");
  process.exit(1);
}
const admin = createClient("https://iwpnsyuvqvmdlsbkbzly.supabase.co", process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

// The CSV from sia-candidates.py has no quoted commas except, possibly, in the last column (the name)
const [header, ...lines] = readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
const columns = header.split(",");
const rows = lines.map((line) => {
  const cells = line.split(",");
  return Object.fromEntries(columns.map((c, i) => [c, i === columns.length - 1 ? cells.slice(i).join(",").replace(/^"|"$/g, "") : cells[i]]));
});

const { data: programs } = await admin.from("programs").select("id, slug");
const programId = new Map(programs.map((p) => [p.slug, p.id]));
const { data: profiles } = await admin.from("profiles").select("id, email, role").in("email", rows.map((r) => r.email));
const byEmail = new Map(profiles.map((p) => [p.email, p]));
const source = `SIA ${new Date().toISOString().slice(0, 10)}`;
const tally = { invitados: 0, actualizados: 0, omitidos: [] };

for (const r of rows) {
  if (!/^[^@\s]+@unal\.edu\.co$/.test(r.email) || !programId.has(r.program)) {
    tally.omitidos.push(`${r.email}: correo o programa no válido`);
    continue;
  }
  const data = { program: r.program, program_name: r.program_name, progress_pct: Number(r.progress_pct), papa: r.papa ? Number(r.papa) : null, source };
  const profile = byEmail.get(r.email);
  if (profile && !["user", "student"].includes(profile.role)) {
    tally.omitidos.push(`${r.email}: ya tiene el rol ${profile.role}`);
    continue;
  }
  if (!CONFIRM) {
    tally[profile ? "actualizados" : "invitados"]++;
    continue;
  }
  if (profile) {
    if (profile.role === "user") await admin.from("profiles").update({ role: "student" }).eq("id", profile.id);
    const { error } = await admin
      .from("students")
      .update({ program_id: programId.get(r.program), progress_pct: data.progress_pct, papa: data.papa, progress_verified: "coordinacion", progress_verified_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (error) tally.omitidos.push(`${r.email}: ${error.message}`);
    else tally.actualizados++;
  } else {
    const { error } = await admin.from("role_invites").upsert({ email: r.email, role: "student", student_data: data });
    if (error) tally.omitidos.push(`${r.email}: ${error.message}`);
    else tally.invitados++;
  }
}

console.log(CONFIRM ? "== Cargado" : "== Simulación (sin cambios; usa --confirm para cargar)");
console.log(`Registrados para su primer ingreso: ${tally.invitados}`);
console.log(`Cuentas existentes actualizadas: ${tally.actualizados}`);
console.log(`Omitidos: ${tally.omitidos.length}${tally.omitidos.length ? "\n  " + tally.omitidos.join("\n  ") : ""}`);
