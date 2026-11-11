import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CompanyStatus, Role } from "@/lib/types";
import { ROLE_HOME } from "@/lib/roles";

export type Session = {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
  level: 0 | 1 | 2;
  company: { id: string; name: string; status: CompanyStatus; authorized_until: string | null } | null;
};

export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("email, full_name, role, avatar_path").eq("id", user.id).single();
  if (!profile) return null;

  let company: Session["company"] = null;
  if (profile.role === "company") {
    const { data } = await supabase
      .from("company_members")
      .select("companies(id, name, status, authorized_until)")
      .eq("user_id", user.id)
      .maybeSingle();
    company = (data?.companies as unknown as Session["company"]) ?? null;
  }

  const { data: level } = await supabase.rpc("access_level");

  return {
    userId: user.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_path ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl : null,
    role: profile.role as Role,
    level: (level ?? 0) as 0 | 1 | 2,
    company,
  };
});

export function homeFor(role: Role) {
  return ROLE_HOME[role] ?? "/cuenta";
}

export async function requireRole(roles: Role[]) {
  const session = await getSession();
  if (!session) redirect("/ingresar");
  if (!roles.includes(session.role)) redirect(homeFor(session.role));
  return session;
}
