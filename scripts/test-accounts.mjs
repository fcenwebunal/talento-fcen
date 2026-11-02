// Creates (or refreshes) one test account per role, all signing in through «Ingreso externo» with DEMO_PASSWORD:
// estudiante.demo@fcen.test, empresa.demo@fcen.test, facultad.demo@fcen.test, admin.demo@fcen.test.
// Run: node --env-file=.env.local scripts/test-accounts.mjs   (the password is never printed)
import { createClient } from "@supabase/supabase-js";

const admin = createClient("https://iwpnsyuvqvmdlsbkbzly.supabase.co", process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const password = process.env.DEMO_PASSWORD;
if (!password) throw new Error("Falta DEMO_PASSWORD en .env.local");

const ACCOUNTS = [
  { email: "estudiante.demo@fcen.test", role: "student", name: "Estudiante de prueba" },
  { email: "empresa.demo@fcen.test", role: "company", name: "Empresa de prueba" },
  { email: "facultad.demo@fcen.test", role: "staff", name: "Facultad de prueba" },
  { email: "admin.demo@fcen.test", role: "admin", name: "Administración de prueba" },
];

async function findUser(email) {
  for (let page = 1; page < 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const user = data.users.find((u) => u.email === email);
    if (user || data.users.length < 200) return user ?? null;
  }
  return null;
}

for (const acc of ACCOUNTS) {
  let user = await findUser(acc.email);
  if (user) {
    await admin.auth.admin.updateUserById(user.id, { password });
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email: acc.email, password, email_confirm: true, user_metadata: { full_name: acc.name } });
    if (error) throw error;
    user = data.user;
  }
  const id = user.id;
  await admin.from("profiles").update({ role: acc.role, full_name: acc.name }).eq("id", id);

  if (acc.role === "student") {
    await admin.from("students").upsert({
      id,
      program_id: 1,
      headline: "Cuenta de prueba de la plataforma",
      about: "Perfil de prueba para revisar la interfaz de estudiante.",
      availability: "disponible",
      consent_anonymous: false,
      consent_contact: false,
      truthful_declared: true,
    });
    await admin.from("student_private").upsert({ student_id: id });
  }

  if (acc.role === "company") {
    const { data: member } = await admin.from("company_members").select("company_id").eq("user_id", id).maybeSingle();
    if (!member) {
      const { data: company, error } = await admin
        .from("companies")
        .insert({
          nit: "900000000-1",
          name: "Empresa de prueba S.A.S.",
          sector: "Software y servicios TIC",
          size: "pequena",
          city: "Manizales",
          description: "Organización ficticia para probar la plataforma.",
          status: "autorizada",
          authorized_at: new Date().toISOString(),
          authorized_until: new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10),
          terms_version: "2026-10-31",
          terms_accepted_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      await admin.from("company_members").insert({ user_id: id, company_id: company.id, member_role: "owner", contact_name: acc.name, position: "Selección" });
    }
  }
  console.log(`listo: ${acc.email} (${acc.role})`);
}
