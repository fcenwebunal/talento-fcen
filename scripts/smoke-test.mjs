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
const invitedAdmin = `talento.prueba.${stamp}.admin-registrado@unal.edu.co`;
const password = `Prueba-${stamp}-x`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "OK  " : "FALLA"} ${name}${extra ? ` (${extra})` : ""}`);
const roleOf = async (id) => (await admin.from("profiles").select("role").eq("id", id).single()).data?.role;

// The admin API always creates email accounts (it ignores app_metadata.provider), so Google sign-ups are checked in SQL below.
async function createAccount(email, { role } = {}) {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Cuenta De Prueba" } });
  if (error) throw error;
  if (role) await admin.from("profiles").update({ role }).eq("id", data.user.id);
  return data.user.id;
}
// Simulates two Google sign-ups (one registered by an administrator) inside a block that always rolls back.
async function googleSignupCheck(registered, unregistered, fromSia) {
  const sql = `do $$
declare
  v_reg uuid := gen_random_uuid();
  v_new uuid := gen_random_uuid();
  v_sia uuid := gen_random_uuid();
  v_role_reg text; v_role_new text; v_left int; v_sia_data text;
begin
  insert into public.role_invites (email, role) values ('${registered}', 'staff');
  insert into public.role_invites (email, role, student_data)
    values ('${fromSia}', 'student', '{"program":"ingenieria-fisica","progress_pct":80.5,"papa":4.1,"source":"prueba"}');
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
    (v_reg, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '${registered}', '{"provider":"google","providers":["google"]}', '{}', now(), now()),
    (v_new, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '${unregistered}', '{"provider":"google","providers":["google"]}', '{}', now(), now()),
    (v_sia, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '${fromSia}', '{"provider":"google","providers":["google"]}', '{}', now(), now());
  select role into v_role_reg from public.profiles where id = v_reg;
  select role into v_role_new from public.profiles where id = v_new;
  select count(*) into v_left from public.role_invites where email in ('${registered}', '${fromSia}');
  select concat_ws('/', pr.role, p.slug, s.progress_pct, s.papa, s.progress_verified) into v_sia_data
    from public.students s join public.profiles pr on pr.id = s.id left join public.programs p on p.id = s.program_id where s.id = v_sia;
  raise exception 'SMOKE_RESULT registered=% unregistered=% invites_left=% sia=%', v_role_reg, v_role_new, v_left, v_sia_data;
end $$;`;
  const res = await fetch("https://api.supabase.com/v1/projects/iwpnsyuvqvmdlsbkbzly/database/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  const match = /SMOKE_RESULT registered=(\w+) unregistered=(\w+) invites_left=(\d+) sia=([\w./-]+)/.exec(text);
  if (!match) throw new Error(`Prueba de Google sin resultado: ${text.slice(0, 200)}`);
  return { registered: match[1], unregistered: match[2], invitesLeft: Number(match[3]), sia: match[4] };
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
  studentId = await createAccount(studentEmail);
  userIds.push(studentId);
  check("Una cuenta nueva con correo UNAL entra como usuario", (await roleOf(studentId)) === "user", await roleOf(studentId));

  const google = await googleSignupCheck(invitedGoogle, `talento.prueba.${stamp}.google@unal.edu.co`, `talento.prueba.${stamp}.sia@unal.edu.co`);
  check("Al entrar con Google sin registro previo queda como usuario", google.unregistered === "user", google.unregistered);
  check("Al entrar con Google recibe el rol que registró un administrador", google.registered === "staff", google.registered);
  check("Los registros usados se borran", google.invitesLeft === 0, String(google.invitesLeft));
  check("Un estudiante registrado desde el SIA entra con programa, avance y PAPA verificados", google.sia === "student/ingenieria-fisica/80.50/4.1/coordinacion", google.sia);

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
    consent_anonymous: true, consent_contact: true, availability: "disponible",
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

  const staffAdmin = await staff.rpc("set_user_role", { p_user: companyUserId, p_role: "admin" });
  check("La Facultad no puede dar el rol de administrador", !!staffAdmin.error && (await roleOf(companyUserId)) === "user", staffAdmin.error?.message);
  const staffCompany = await staff.rpc("set_user_role", { p_user: companyUserId, p_role: "company" });
  check("La Facultad pasa un usuario a empresa", !staffCompany.error && (await roleOf(companyUserId)) === "company", staffCompany.error?.message);
  const staffChange = await staff.rpc("set_user_role", { p_user: companyUserId, p_role: "student" });
  check("La Facultad no cambia el rol de una cuenta que ya tiene rol", !!staffChange.error && (await roleOf(companyUserId)) === "company", staffChange.error?.message);

  const staffInvite = await staff.rpc("invite_user", { p_email: invitedGoogle, p_role: "student" });
  check("La Facultad registra un correo como estudiante", staffInvite.data === "invited", staffInvite.error?.message);
  const staffInviteAdmin = await staff.rpc("invite_user", { p_email: invitedAdmin, p_role: "admin" });
  check("La Facultad no puede registrar administradores", !!staffInviteAdmin.error);
  const bossInviteAdmin = await boss.rpc("invite_user", { p_email: invitedAdmin, p_role: "admin" });
  const staffOverAdmin = await staff.rpc("invite_user", { p_email: invitedAdmin, p_role: "student" });
  const { data: stillAdmin } = await admin.from("role_invites").select("role").eq("email", invitedAdmin).single();
  check("La Facultad no cambia un registro de administrador", bossInviteAdmin.data === "invited" && !!staffOverAdmin.error && stillAdmin?.role === "admin", staffOverAdmin.error?.message);
  await staff.from("role_invites").delete().in("email", [invitedAdmin, invitedGoogle]);
  const { data: leftAfterStaff } = await admin.from("role_invites").select("email").in("email", [invitedAdmin, invitedGoogle]);
  check("La Facultad quita registros con sus roles pero no los de administrador", leftAfterStaff?.length === 1 && leftAfterStaff[0].email === invitedAdmin);
  const bossChange = await boss.rpc("invite_user", { p_email: invitedAdmin, p_role: "staff" });
  const { data: changed } = await admin.from("role_invites").select("role").eq("email", invitedAdmin).single();
  check("Un administrador cambia el rol de un registro pendiente", bossChange.data === "changed" && changed?.role === "staff", bossChange.error?.message);

  const bossSelf = await boss.rpc("set_user_role", { p_user: adminId, p_role: "student" });
  check("Un administrador no puede cambiar su propio rol", !!bossSelf.error && (await roleOf(adminId)) === "admin", bossSelf.error?.message);

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

  const inv = await boss.rpc("invite_user", { p_email: invitedTyped, p_role: "admin" });
  check("Un administrador registra un correo con su rol", inv.data === "invited", inv.error?.message);
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
  // Logs keep no foreign key to the throwaway accounts (or set it to null): delete them first so the real data stays clean
  const traced = [...userIds, companyId].filter(Boolean);
  if (traced.length) {
    await admin.from("exports_log").delete().in("user_id", userIds);
    if (companyId) await admin.from("exports_log").delete().eq("company_id", companyId);
    await admin.from("status_history").delete().in("entity_id", traced);
    await admin.from("contact_events").delete().in("user_id", userIds);
  }
  if (companyId) await admin.from("companies").delete().eq("id", companyId);
  for (const id of userIds) await admin.auth.admin.deleteUser(id);
  await admin.from("role_invites").delete().like("email", "talento.prueba.%");
  const { data: left } = await admin.from("profiles").select("id").like("email", "talento.prueba.%");
  results.push(`Limpieza: ${left?.length ? "quedaron " + left.length + " cuentas de prueba" : "cuentas de prueba borradas"}`);
  console.log(results.join("\n"));
}
