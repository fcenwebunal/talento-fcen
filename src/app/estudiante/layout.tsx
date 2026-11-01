import { requireRole } from "@/lib/session";
import { AppShell, STUDENT_NAV } from "@/components/app-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["student"]);
  return (
    <AppShell session={session} items={STUDENT_NAV}>
      {children}
    </AppShell>
  );
}
