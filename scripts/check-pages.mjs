// Signs in with demo accounts and loads every role page on the deployed app, reporting status and render errors.
// The demo accounts were deleted on 2026-11-11 (real use): it only works again with temporary demo data (ALLOW_DEMO_DATA=1).
// Run: node --env-file=.env.local scripts/check-pages.mjs [baseUrl]   (uses DEMO_PASSWORD, never prints it)
import { createServerClient } from "@supabase/ssr";

const BASE = process.argv[2] ?? "https://talento-fcen--talentofcen.us-east4.hosted.app";
const URL_ = "https://iwpnsyuvqvmdlsbkbzly.supabase.co";
const KEY = "sb_publishable_uxq4iuk9aDfEOBMv9GzAXw_oO-KkZ8H";

const CASES = [
  { email: "variosara.demo@unal.edu.co", pages: ["/estudiante", "/estudiante/perfil", "/estudiante/perfil?seccion=documentos", "/estudiante/vista-previa", "/estudiante/vista-previa?nivel=autorizada", "/cuenta"] },
  { email: "seleccion.demo@analiticacafetera.co", pages: ["/empresa", "/empresa/buscar", "/empresa/buscar?q=python", "/empresa/favoritos", "/cuenta", "/empresa/exportar"] },
  { email: "seleccion.demo@metrocalcaldas.co", pages: ["/empresa", "/empresa/buscar", "/empresa/exportar"] },
];

async function sessionCookies(email) {
  const jar = new Map();
  const supabase = createServerClient(URL_, KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password: process.env.DEMO_PASSWORD });
  if (error) throw new Error(`${email}: ${error.message}`);
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

for (const c of CASES) {
  const cookie = await sessionCookies(c.email);
  console.log(`\n${c.email}`);
  for (const path of c.pages) {
    const res = await fetch(BASE + path, { headers: { cookie }, redirect: "manual" });
    const body = res.status === 200 ? await res.text() : "";
    const failed = /Application error|digest|Internal Server Error|NEXT_REDIRECT/.test(body) && !/text\/csv/.test(res.headers.get("content-type") ?? "");
    const type = (res.headers.get("content-type") ?? "").split(";")[0];
    const where = res.headers.get("location") ? ` -> ${res.headers.get("location")}` : "";
    console.log(`  ${failed ? "ERROR" : "ok   "} ${res.status} ${type.padEnd(10)} ${path}${where}`);
  }
}
