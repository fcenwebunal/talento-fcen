// End-to-end check of roles and visibility levels against the real project, with throwaway accounts that are deleted at the end.
// Run: node --env-file=.env.local scripts/smoke-test.mjs   (never prints secrets)
import { createClient } from "@supabase/supabase-js";

const URL = "https://iwpnsyuvqvmdlsbkbzly.supabase.co";
const PUBLISHABLE = "sb_publishable_uxq4iuk9aDfEOBMv9GzAXw_oO-KkZ8H";
const admin = createClient(URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const anonClient = () => createClient(URL, PUBLISHABLE, { auth: { persistSession: false } });

const stamp = Date.now();
const studentEmail = `talento.prueba.${stamp}@unal.edu.co`;
const companyEmail = `talento.prueba.${stamp}@example.com`;
const staffEmail = `talento.prueba.${stamp}.facultad@example.com`;
const adminEmail = `talento.prueba.${stamp}.admin@example.com`;
const invitedGoogle = `talento.prueba.${stamp}.invitado@unal.edu.co`;
const invitedTyped = `talento.prueba.${stamp}.escrito@unal.edu.co`;
const password = `Prueba-${stamp}-x`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "OK  " : "FALLA"} ${name}${extra ? ` (${extra})` : ""}`);
const roleOf = async (id) => (await admin.from("profiles").select("role").eq("id", id).single()).data?.role;

// The admin API cannot sign in with Google; app_metadata.provider = google makes the trigger treat the account as one.
async function createAccount(email, { google = false, role } = {}) {
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    ...(google ? { app_metadata: { provider: "google" } } : {}),
    user_metadata: { full_name: "Cuenta De Prueba" },
  });
  if (error) throw error;
  if (role) await admin.from("profiles").update({ role }).eq("id", data.user.id);
  return data.user.id;
}
async function signedIn(email) {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

const userIds = [];
let studentId, companyUserId, companyId;
try {
  studentId = await createAccount(studentEmail, { google: true });
  userIds.push(studentId);
  check("Una cuenta nueva de Google UNAL entra como usuario", (await roleOf(studentId)) === "user", await roleOf(studentId));

  const staffId = await createAccount(staffEmail, { role: "staff" });
  const adminId = await createAccount(adminEmail, { role: "admin" });
  userIds.push(staffId, adminId);
  const staff = await signedIn(staffEmail);
  const boss = await signedIn(adminEmail);

  const approve = await staff.rpc("set_user_role", { p_user: studentId, p_role: "student" });
  check("La Facultad aprueba a un usuario como estudiante", !approve.error && (await roleOf(studentId)) === "student", approve.error?.message);
  const { data: rows } = await admin.from("students").select("id").eq("id", studentId);
  check("Al ser estudiante se crean sus filas de perfil", rows?.length === 1);
  await admin.from("profiles").update({ full_name: "Estudiante De Prueba" }).eq("id", studentId);

  const student = await signedIn(studentEmail);
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
  check("El estudiante no puede volverse administrador", (await roleOf(studentId)) === "student", roleHack.error?.message ?? "sin error, pero sin cambio");

  const verifHack = await student.from("students").update({ progress_verified: "coordinacion" }).eq("id", studentId);
  const { data: verifAfter } = await admin.from("students").select("progress_verified").eq("id", studentId).single();
  check("El estudiante no puede marcar su avance como verificado", verifAfter.progress_verified === "autodeclarado", verifHack.error?.message);

  const company = anonClient();
  const { data: signup, error: e2 } = await company.auth.signUp({ email: companyEmail, password });
  if (e2) throw e2;
  companyUserId = signup.user.id;
  userIds.push(companyUserId);
  check("Registro con correo y contraseña sin confirmación por correo", !!signup.session);
  check("La cuenta nueva con correo queda como usuario", (await roleOf(companyUserId)) === "user", await roleOf(companyUserId));

  const before = await company.rpc("search_students", { p_filters: {} });
  check("Un usuario sin rol no puede buscar estudiantes", !!before.error);
  const early = await company.rpc("register_company", {
    p_data: { name: "Empresa Temprana SAS", nit: `901${String(stamp).slice(-6)}-1`, contact_name: "Contacto", terms_accepted: true },
  });
  check("Un usuario sin rol no puede registrar una organización", !!early.error);
  if (early.data) await admin.from("companies").delete().eq("id", early.data);
  const selfRole = await company.from("profiles").update({ role: "company" }).eq("id", companyUserId);
  check("Un usuario no puede darse un rol", (await roleOf(companyUserId)) === "user", selfRole.error?.message ?? "sin error, pero sin cambio");

  const staffCompany = await staff.rpc("set_user_role", { p_user: companyUserId, p_role: "company" });
  check("La Facultad no puede asignar el rol de empresa", !!staffCompany.error && (await roleOf(companyUserId)) === "user", staffCompany.error?.message);
  const staffInvite = await staff.rpc("invite_user", { p_email: invitedGoogle, p_role: "student" });
  check("La Facultad no puede registrar usuarios", !!staffInvite.error);
  const bossSelf = await boss.rpc("set_user_role", { p_user: adminId, p_role: "student" });
  check("Un administrador no puede cambiar su propio rol", !!bossSelf.error && (await roleOf(adminId)) === "admin", bossSelf.error?.message);

  const bossCompany = await boss.rpc("set_user_role", { p_user: companyUserId, p_role: "company" });
  check("Un administrador asigna el rol de empresa", !bossCompany.error && (await roleOf(companyUserId)) === "company", bossCompany.error?.message);

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

  await boss.rpc("set_user_role", { p_user: studentId, p_role: "user" });
  const exStudent = await company.rpc("search_students", { p_filters: { q: "prueba automática" } });
  check("Si deja de ser estudiante, las empresas dejan de verlo", !(exStudent.data ?? []).some((r) => r.student_id === studentId));
  await boss.rpc("set_user_role", { p_user: studentId, p_role: "student" });
  const backStudent = await company.rpc("search_students", { p_filters: { q: "prueba automática" } });
  check("Si vuelve a ser estudiante, su perfil reaparece con sus datos", (backStudent.data ?? []).some((r) => r.student_id === studentId));

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

  await boss.rpc("set_user_role", { p_user: companyUserId, p_role: "user" });
  const exCompany = await company.rpc("search_students", { p_filters: {} });
  check("Si deja de ser empresa, pierde el acceso a la búsqueda", !!exCompany.error);

  const inv1 = await boss.rpc("invite_user", { p_email: invitedGoogle, p_role: "staff" });
  const inv2 = await boss.rpc("invite_user", { p_email: invitedTyped, p_role: "admin" });
  check("Un administrador registra correos con su rol", inv1.data === "invited" && inv2.data === "invited", inv1.error?.message ?? inv2.error?.message);
  const googleId = await createAccount(invitedGoogle, { google: true });
  userIds.push(googleId);
  check("Al entrar con Google recibe el rol registrado", (await roleOf(googleId)) === "staff", await roleOf(googleId));
  const { count: leftInvite } = await admin.from("role_invites").select("email", { count: "exact", head: true }).eq("email", invitedGoogle);
  check("El registro usado se borra", leftInvite === 0);
  const typedId = await createAccount(invitedTyped);
  userIds.push(typedId);
  check("Una cuenta con contraseña no toma el rol registrado (correo sin verificar)", (await roleOf(typedId)) === "user", await roleOf(typedId));
  const invExisting = await boss.rpc("invite_user", { p_email: invitedTyped, p_role: "company" });
  check("Registrar un correo que ya tiene cuenta cambia su rol de inmediato", invExisting.data === "updated" && (await roleOf(typedId)) === "company", invExisting.error?.message);

  const anon = await anonClient().rpc("public_stats");
  check("Las cifras públicas funcionan sin sesión", !anon.error);
} catch (e) {
  results.push(`ERROR ${e.message ?? e}`);
} finally {
  if (companyId) await admin.from("companies").delete().eq("id", companyId);
  for (const id of userIds) await admin.auth.admin.deleteUser(id);
  await admin.from("role_invites").delete().like("email", "talento.prueba.%");
  const { data: left } = await admin.from("profiles").select("id").like("email", "talento.prueba.%");
  results.push(`Limpieza: ${left?.length ? "quedaron " + left.length + " cuentas de prueba" : "cuentas de prueba borradas"}`);
  console.log(results.join("\n"));
}
