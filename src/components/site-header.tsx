import { getSession } from "@/lib/session";
import { FcenBanner } from "./fcen-banner";
import { HeaderNav } from "./header-nav";

export async function SiteHeader({ embedded = false }: { embedded?: boolean }) {
  const session = await getSession();
  return (
    <>
      <FcenBanner />
      <HeaderNav role={session?.role ?? null} name={session?.fullName ?? null} email={session?.email ?? null} avatarUrl={session?.avatarUrl ?? null} embedded={embedded} />
    </>
  );
}
