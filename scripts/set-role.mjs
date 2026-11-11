// Assigns a role to an account. Run: node --env-file=.env.local scripts/set-role.mjs <email> <user|student|company|staff|admin>
// If the person has not signed in yet, the email is registered and gets the role on its first Google sign-in.
// Student rows are created by the database (trigger profiles_role_rows).
import { createClient } from "@supabase/supabase-js";

const ROLES = ["user", "student", "company", "staff", "admin"];
const [email, role] = process.argv.slice(2);
if (!email || !ROLES.includes(role)) {
  console.error(`Uso: node --env-file=.env.local scripts/set-role.mjs <correo> <${ROLES.join("|")}>`);
  process.exit(1);
}

const admin = createClient("https://iwpnsyuvqvmdlsbkbzly.supabase.co", process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
const address = email.trim().toLowerCase();

const { data, error } = await admin.from("profiles").update({ role }).eq("email", address).select("email, role");
if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
if (data.length) {
  console.log(data);
} else if (role === "user") {
  console.log(`No existe una cuenta con ${address}.`);
} else {
  const { error: inviteError } = await admin.from("role_invites").upsert({ email: address, role });
  if (inviteError) {
    console.error("Error:", inviteError.message);
    process.exit(1);
  }
  console.log(`${address} todavía no ha entrado: quedó registrado y tendrá el rol ${role} cuando entre con Google.`);
}
