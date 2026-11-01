import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const session = await getSession();
  redirect(session ? homeFor(session.role) : "/ingresar");
}
