import { getSession } from "@/lib/session";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const session = await getSession();
  return <HeaderNav role={session?.role ?? null} name={session?.fullName ?? null} email={session?.email ?? null} />;
}
