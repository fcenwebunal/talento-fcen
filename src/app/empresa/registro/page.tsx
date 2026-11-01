import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Registrar empresa" };
export const dynamic = "force-dynamic";

export default async function CompanyRegisterPage() {
  const session = await requireRole(["company"]);
  if (session.company) redirect("/empresa");

  return (
    <div className="wrap max-w-3xl py-10">
      <h1 className="display text-3xl text-azul-oscuro">Registre su organización</h1>
      <p className="mt-2 text-suave">
        Con el registro puede buscar perfiles anónimos. Después podrá solicitar la autorización de la Facultad para ver datos de contacto.
      </p>
      <CompanyForm defaultEmail={session.email} />
    </div>
  );
}
