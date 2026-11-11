import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleUserRound, Hourglass, PencilLine } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { AccountForm, CompanyEditForm } from "./forms";

export const metadata: Metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireRole(["user", "student", "company", "staff", "admin"]);
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name, position, bio, avatar_path, email").eq("id", session.userId).single();
  const company = session.company
    ? (await supabase.from("companies").select("id, name, nit, sector, size, city, website, description, logo_path").eq("id", session.company.id).single()).data
    : null;

  return (
    <>
      <PageHeader kicker="Mi cuenta" icon={CircleUserRound} title="Mis datos" description="Tu foto, tu nombre y cómo te presentas en la plataforma." />
      {session.role === "user" && (
        <div className="card mb-5 flex gap-4 border-l-4 border-l-amarillo">
          <Hourglass className="mt-0.5 h-6 w-6 shrink-0 text-azul" aria-hidden="true" />
          <div className="space-y-1 text-sm">
            <p className="font-black text-azul-oscuro">Tu cuenta está en revisión</p>
            <p className="text-suave">
              La Facultad revisa cada cuenta nueva y le asigna su rol: estudiante, empresa o personal de la Facultad. Cuando lo tengas, al volver a
              entrar verás tu espacio de trabajo. Mientras tanto puedes completar tu foto y tus datos.
            </p>
            <p className="text-suave">
              ¿Tarda demasiado? Escribe a la coordinación de prácticas de la Facultad con el correo de tu cuenta: <strong className="text-texto">{session.email}</strong>.
            </p>
          </div>
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-2">
        <AccountForm
          userId={session.userId}
          email={profile?.email ?? session.email}
          initial={{ full_name: profile?.full_name ?? "", position: profile?.position ?? "", bio: profile?.bio ?? "" }}
          avatarUrl={session.avatarUrl}
          positionLabel={
            session.role === "company"
              ? "Cargo en la organización"
              : session.role === "student"
                ? "Titular corto"
                : session.role === "user"
                  ? "Cargo, programa u organización"
                  : "Cargo en la Facultad"
          }
        />
        {company && (
          <CompanyEditForm
            company={{ ...company, logo_url: company.logo_path ? supabase.storage.from("logos").getPublicUrl(company.logo_path).data.publicUrl : null }}
          />
        )}
        {session.role === "student" && (
          <Link href="/estudiante/perfil" className="card card-hover group flex items-center gap-4 self-start p-6">
            <span className="icon-tile h-12 w-12">
              <PencilLine />
            </span>
            <span className="flex-1">
              <span className="block font-black text-azul-oscuro">Perfil profesional</span>
              <span className="text-sm text-suave">Habilidades, experiencia, disponibilidad y documentos que ven las empresas.</span>
            </span>
            <ArrowRight className="h-4 w-4 text-suave transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </>
  );
}
