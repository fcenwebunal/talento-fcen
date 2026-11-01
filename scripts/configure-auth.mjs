// Configures Supabase Auth through the Management API. Run: node --env-file=.env.local scripts/configure-auth.mjs
// Never prints secret values.

const REF = "iwpnsyuvqvmdlsbkbzly";
const SITE = "https://talento-fcen--talentofcen.us-east4.hosted.app";
const GOOGLE_CLIENT_ID = "857627517671-0qtve299itfvsnmomkas00hqvjvo8833.apps.googleusercontent.com";

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("Falta SUPABASE_ACCESS_TOKEN en .env.local");
  process.exit(1);
}

const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
const body = {
  site_url: SITE,
  uri_allow_list: [`${SITE}/**`, "http://localhost:3000/**"].join(","),
  external_email_enabled: true,
  mailer_autoconfirm: true,
  password_min_length: 8,
  disable_signup: false,
  ...(googleSecret
    ? { external_google_enabled: true, external_google_client_id: GOOGLE_CLIENT_ID, external_google_secret: googleSecret }
    : {}),
};

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error("Error", res.status, (await res.text()).slice(0, 300));
  process.exit(1);
}

const cfg = await res.json();
console.log({
  site_url: cfg.site_url,
  uri_allow_list: cfg.uri_allow_list,
  mailer_autoconfirm: cfg.mailer_autoconfirm,
  password_min_length: cfg.password_min_length,
  google: cfg.external_google_enabled ? "activo" : "pendiente (falta GOOGLE_CLIENT_SECRET)",
});
