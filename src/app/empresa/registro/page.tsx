import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2, TriangleAlert } from "lucide-react";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Registrar empresa" };
export const dynamic = "force-dynamic";

export default async function CompanyRegisterPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const session = await requireRole(["company"]);
  if (session.company) redirect("/empresa");
  const { aviso } = await searchParams;

  return (
    <>
      <PageHeader
        kicker="Paso 1 de 2"
        icon={Building2}
        title="Registre su organización"
        description="Con el registro puede buscar perfiles anónimos. Después podrá solicitar la autorización de la Facultad para ver datos de contacto."
      />
      <div className="wrap max-w-4xl">
        {aviso === "no-unal" && (
          <p className="mb-5 flex gap-3 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] border border-amarillo/50 bg-amarillo/10 p-4 text-sm text-amarillo-tinta">
            <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
            Entraste con una cuenta de Google que no es @unal.edu.co, por eso la plataforma la tomó como cuenta de empresa. Si eres estudiante, cierra sesión y entra con tu cuenta institucional.
          </p>
        )}
        <CompanyForm defaultEmail={session.email} />
      </div>
    </>
  );
}
