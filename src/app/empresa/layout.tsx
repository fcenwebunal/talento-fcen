import { requireRole } from "@/lib/session";
import { AppShell, COMPANY_NAV } from "@/components/app-shell";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["company"]);
  return (
    <AppShell session={session} items={COMPANY_NAV}>
      {children}
    </AppShell>
  );
}
