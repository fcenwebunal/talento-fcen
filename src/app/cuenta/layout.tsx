import { requireRole } from "@/lib/session";
import { ADMIN_NAV, AppShell, COMPANY_NAV, STUDENT_NAV } from "@/components/app-shell";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["student", "company", "staff", "admin"]);
  const items = session.role === "student" ? STUDENT_NAV : session.role === "company" ? COMPANY_NAV : ADMIN_NAV;
  return (
    <AppShell session={session} items={items}>
      {children}
    </AppShell>
  );
}
