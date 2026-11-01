// Assigns a role to an existing account. Run: node --env-file=.env.local scripts/set-role.mjs <email> <student|staff|admin>
// The person must have signed in at least once.
import { createClient } from "@supabase/supabase-js";

const [email, role] = process.argv.slice(2);
if (!email || !["student", "staff", "admin"].includes(role)) {
  console.error("Uso: node --env-file=.env.local scripts/set-role.mjs <correo> <student|staff|admin>");
  process.exit(1);
}

const admin = createClient("https://iwpnsyuvqvmdlsbkbzly.supabase.co", process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await admin.from("profiles").update({ role }).eq("email", email.toLowerCase()).select("email, role");
if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
console.log(data.length ? data : `No existe una cuenta con ${email}: debe ingresar una vez primero.`);
