export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://iwpnsyuvqvmdlsbkbzly.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_uxq4iuk9aDfEOBMv9GzAXw_oO-KkZ8H";

export const UNAL_DOMAIN = "unal.edu.co";
export const AVAILABILITY_DAYS = 90;

export const PUBLIC_SITE = "https://talento-fcen--talentofcen.us-east4.hosted.app";
export const FCEN_ORIGIN = "https://fcen.unal.edu.co";
export const EMBED_COOKIE = "tf_embed";

// The app runs inside an iframe on fcen.unal.edu.co: session cookies must travel in third-party context.
export const COOKIE_OPTIONS =
  process.env.NODE_ENV === "production" ? ({ sameSite: "none", secure: true, partitioned: true, path: "/" } as const) : undefined;
