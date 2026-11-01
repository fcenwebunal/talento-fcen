// End-to-end check of visibility levels against the real project, with throwaway accounts that are deleted at the end.
// Run: node --env-file=.env.local scripts/smoke-test.mjs   (never prints secrets)
import { createClient } from "@supabase/supabase-js";

const URL = "https://iwpnsyuvqvmdlsbkbzly.supabase.co";
const PUBLISHABLE = "sb_publishable_uxq4iuk9aDfEOBMv9GzAXw_oO-KkZ8H";
const admin = createClient(URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const anonClient = () => createClient(URL, PUBLISHABLE, { auth: { persistSession: false } });

const stamp = Date.now();
const studentEmail = `talento.prueba.${stamp}@unal.edu.co`;
const companyEmail = `talento.prueba.${stamp}@example.com`;
const password = `Prueba-${stamp}-x`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "OK  " : "FALLA"} ${name}${extra ? ` (${extra})` : ""}`);

let studentId, companyUserId, companyId;
try {
  const { data: created, error: e1 } = await admin.auth.admin.createUser({
    email: studentEmail, password, email_confirm: true,
    app_metadata: { provider: "google" }, user_metadata: { full_name: "Estudiante De Prueba" },
  });
  if (e1) throw e1;
  studentId = created.user.id;
  // The admin API cannot create OAuth users, so the account starts as "company": turn it into a student by hand.
  await admin.from("profiles").update({ role: "student", full_name: "Estudiante De Prueba" }).eq("id", studentId);
  await admin.from("students").insert({ id: studentId });
  await admin.from("student_private").insert({ student_id: studentId });
  const { data: prof } = await admin.from("profiles").select("role").eq("id", studentId).single();
  check("Cuenta de prueba convertida en estudiante", prof?.role === "student", prof?.role);

  const student = anonClient();
  await student.auth.signInWithPassword({ email: studentEmail, password });
  const { data: prog } = await student.from("programs").select("id").eq("slug", "estadistica").single();
  const { data: skillRows } = await student.from("skills").select("id, name").in("name", ["R", "Series de tiempo", "SQL"]);
  const up = await student.from("students").update({
    program_id: prog.id, headline: "Prueba automática", about: "Perfil de prueba", city: "Manizales",
    modalities: ["presencial", "hibrida"], dedication: "completo", practice_period: "2027-1",
    consent_anonymous: true, consent_contact: true, availability: "disponible", progress_pct: 75,
  }).eq("id", studentId);
  check("El estudiante actualiza su perfil", !up.error, up.error?.message);
  await student.from("student_skills").insert(skillRows.map((s, i) => ({ student_id: studentId, skill_id: s.id, level: (i % 3) + 1 })));
  await student.from("student_private").update({ doc_number: "PRUEBA-123", phone: "3000000000" }).eq("student_id", studentId);

  const roleHack = await student.from("profiles").update({ role: "admin" }).eq("id", studentId);
  const { data: roleAfter } = await admin.from("profiles").select("role").eq("id", studentId).single();
  check("El estudiante no puede volverse administrador", roleAfter.role === "student", roleHack.error?.message ?? "sin error, pero sin cambio");

  const verifHack = await student.from("students").update({ progress_verified: "coordinacion" }).eq("id", studentId);
  const { data: verifAfter } = await admin.from("students").select("progress_verified").eq("id", studentId).single();
  check("El estudiante no puede marcar su avance como verificado", verifAfter.progress_verified === "autodeclarado", verifHack.error?.message);

  const company = anonClient();
  const { data: signup, error: e2 } = await company.auth.signUp({ email: companyEmail, password });
  if (e2) throw e2;
  companyUserId = signup.user.id;
  check("Registro de empresa sin confirmación por correo", !!signup.session);

  const before = await company.rpc("search_students", { p_filters: {} });
  check("Empresa sin registrar la organización no puede buscar", !!before.error);

  const reg = await company.rpc("register_company", {
    p_data: { name: "Empresa de Prueba SAS", nit: `900${String(stamp).slice(-6)}-1`, contact_name: "Contacto Prueba", terms_accepted: true },
  });
  companyId = reg.data;
  check("La empresa registra su organización", !reg.error, reg.error?.message);

  const lvl1 = await company.rpc("search_students", { p_filters: { skill_ids: skillRows.map((s) => s.id) } });
  const row1 = (lvl1.data ?? []).find((r) => r.student_id === studentId);
  check("Nivel 1: encuentra el perfil por habilidades", !!row1, `${lvl1.data?.length ?? 0} resultados`);
  check("Nivel 1: sin nombre ni correo ni teléfono", row1 && !row1.full_name && !row1.email && !row1.phone);

  const priv1 = await company.from("student_private").select("*");
  check("Nivel 1: no ve datos privados", (priv1.data ?? []).length === 0);
  const raw1 = await company.from("students").select("id");
  check("Nivel 1: no lee la tabla de estudiantes directamente", (raw1.data ?? []).length === 0);

  const exp1 = await company.rpc("export_students", { p_filters: {} });
  check("Nivel 1: no puede exportar", !!exp1.error);

  const selfAuth = await company.from("companies").update({ status: "autorizada" }).eq("id", companyId);
  const { data: stAfter } = await admin.from("companies").select("status").eq("id", companyId).single();
  check("La empresa no puede autorizarse sola", stAfter.status === "registrada", selfAuth.error?.message);

  await admin.from("companies").update({ status: "autorizada", authorized_until: "2099-01-01" }).eq("id", companyId);

  const lvl2 = await company.rpc("search_students", { p_filters: { q: "prueba automática" } });
  const row2 = (lvl2.data ?? []).find((r) => r.student_id === studentId);
  check("Nivel 2: ve nombre y contacto de quien lo autorizó", row2?.full_name === "Estudiante De Prueba" && !!row2?.email);

  const detail = await company.rpc("get_student_detail", { p_student: studentId });
  check("Nivel 2: el detalle no trae el documento de identidad", !JSON.stringify(detail.data ?? {}).includes("PRUEBA-123"));

  const exp2 = await company.rpc("export_students", { p_filters: { q: "prueba automática" } });
  check("Nivel 2: exporta", !exp2.error && exp2.data?.length === 1, exp2.error?.message);
  check("La exportación no incluye datos sensibles", exp2.data && !JSON.stringify(exp2.data).includes("PRUEBA-123"));
  const { count: logs } = await admin.from("exports_log").select("id", { count: "exact", head: true }).eq("company_id", companyId);
  check("La exportación queda registrada", logs === 1);

  await student.from("students").update({ consent_contact: false }).eq("id", studentId);
  const lvl2b = await company.rpc("search_students", { p_filters: { q: "prueba automática" } });
  const row2b = (lvl2b.data ?? []).find((r) => r.student_id === studentId);
  check("Si el estudiante retira el permiso de contacto, la empresa deja de verlo", row2b && !row2b.full_name);

  await admin.from("students").update({ last_confirmed_at: new Date(Date.now() - 91 * 86400000).toISOString() }).eq("id", studentId);
  const maint = await admin.rpc("run_daily_maintenance");
  const { data: after } = await admin.from("students").select("availability").eq("id", studentId).single();
  check("A los 91 días sin confirmar pasa a sin_confirmar", after.availability === "sin_confirmar", JSON.stringify(maint.data));
  const lvl2c = await company.rpc("search_students", { p_filters: { q: "prueba automática" } });
  check("Un perfil sin confirmar no aparece en búsquedas", !(lvl2c.data ?? []).some((r) => r.student_id === studentId));

  const anon = await anonClient().rpc("public_stats");
  check("Las cifras públicas funcionan sin sesión", !anon.error);
} catch (e) {
  results.push(`ERROR ${e.message ?? e}`);
} finally {
  if (companyId) await admin.from("companies").delete().eq("id", companyId);
  for (const id of [studentId, companyUserId].filter(Boolean)) await admin.auth.admin.deleteUser(id);
  const { data: left } = await admin.from("profiles").select("id").like("email", "talento.prueba.%");
  results.push(`Limpieza: ${left?.length ? "quedaron " + left.length + " cuentas de prueba" : "cuentas de prueba borradas"}`);
  console.log(results.join("\n"));
}
