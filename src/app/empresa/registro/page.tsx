import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Registrar empresa" };
export const dynamic = "force-dynamic";

export default async function CompanyRegisterPage() {
  const session = await requireRole(["company"]);
  if (session.company) redirect("/empresa");

  return (
    <>
      <PageHeader
        kicker="Paso 1 de 2"
        icon={Building2}
        title="Registre su organización"
        description="Con el registro puede buscar perfiles anónimos. Después podrá solicitar la autorización de la Facultad para ver datos de contacto."
      />
      <div className="wrap max-w-4xl">
        <CompanyForm defaultEmail={session.email} />
      </div>
    </>
  );
}
