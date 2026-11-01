import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight, BadgeCheck, BookOpen, Building2, Check, Clock, Download, Eye, FileSearch, Lock, Search, Send,
  ShieldAlert, Star, Users, XCircle,
} from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_STATUS_LABEL, formatDate } from "@/lib/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { Reveal } from "@/components/ui/reveal";
import { HelpTip } from "@/components/ui/help-tip";
import { Avatar } from "@/components/ui/avatar";
import { requestAuthorization } from "./actions";

export const metadata: Metadata = { title: "Mi empresa" };
export const dynamic = "force-dynamic";

export default async function CompanyHome() {
  const session = await requireRole(["company"]);
  if (!session.company) redirect("/empresa/registro");
  const company = session.company;
  const supabase = await createClient();
  const [{ data: full }, { count: favorites }, { count: views }, { count: exportsCount }, { data: stats }] = await Promise.all([
    supabase.from("companies").select("review_note, logo_path, sector, city").eq("id", company.id).single(),
    supabase.from("favorites").select("student_id", { count: "exact", head: true }).eq("company_id", company.id),
    supabase.from("contact_events").select("id", { count: "exact", head: true }).eq("company_id", company.id),
    supabase.from("exports_log").select("id", { count: "exact", head: true }).eq("company_id", company.id),
    supabase.rpc("public_stats"),
  ]);
  const listed = (stats as { students_listed: number } | null)?.students_listed ?? 0;
  const logo = full?.logo_path ? supabase.storage.from("logos").getPublicUrl(full.logo_path).data.publicUrl : null;

  const steps = [
    { label: "Registrada", icon: Building2, done: true },
    { label: "En revisión", icon: Clock, done: ["en_revision", "autorizada"].includes(company.status) },
    { label: "Autorizada", icon: BadgeCheck, done: company.status === "autorizada" },
  ];

  return (
    <>
      <PageHeader
        kicker="Mi empresa"
        title={company.name}
        description={[full?.sector, full?.city].filter(Boolean).join(" · ") || undefined}
        actions={
          <Link href="/empresa/buscar" className="btn btn-accent">
            <Search /> Buscar talento
          </Link>
        }
      >
        <div className="mt-6 flex items-center gap-3">
          <Avatar name={company.name} seed={company.id} src={logo} size={44} square />
          <span className={`chip ${company.status === "autorizada" ? "chip-verde" : "chip-dark"}`}>
            <span className={`status-dot ${company.status === "autorizada" ? "live" : ""}`} />
            {COMPANY_STATUS_LABEL[company.status]}
            {company.status === "autorizada" && company.authorized_until ? ` hasta el ${formatDate(company.authorized_until)}` : ""}
          </span>
        </div>
      </PageHeader>

      <div className="wrap -mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal><Stat icon={Users} value={listed} label="perfiles disponibles" hint="Estudiantes que hoy buscan práctica" /></Reveal>
        <Reveal index={1}><Stat icon={Star} value={favorites ?? 0} label="favoritos" tone="amarillo" /></Reveal>
        <Reveal index={2}><Stat icon={Eye} value={views ?? 0} label="contactos consultados" tone="verde" /></Reveal>
        <Reveal index={3}><Stat icon={Download} value={exportsCount ?? 0} label="exportaciones" tone="naranja" /></Reveal>
      </div>

      <div className="wrap mt-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Reveal className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-black text-azul-oscuro">
            <ShieldAlert className="h-5 w-5 text-azul-medio" aria-hidden="true" /> Autorización de la Facultad
            <HelpTip>Con la autorización ve el nombre, el contacto y la hoja de vida de los estudiantes que lo permitieron, y puede exportar listados. Dura 12 meses.</HelpTip>
          </h2>
          <ol className="mt-6 flex items-center">
            {steps.map((s, i) => (
              <li key={s.label} className="flex flex-1 items-center last:flex-none">
                <span className="flex flex-col items-center gap-1.5">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] ${s.done ? "bg-verde text-white" : "bg-superficie-2 text-suave"}`}>
                    {s.done ? <Check className="h-5 w-5" strokeWidth={3} /> : <s.icon className="h-5 w-5" />}
                  </span>
                  <span className={`text-xs font-black ${s.done ? "text-verde-tinta" : "text-suave"}`}>{s.label}</span>
                </span>
                {i < steps.length - 1 && <span className={`mx-2 mb-5 h-0.5 flex-1 rounded ${steps[i + 1].done ? "bg-verde" : "bg-borde"}`} />}
              </li>
            ))}
          </ol>
          <div className="mt-6 border-t border-borde pt-5">
            {company.status === "registrada" && (
              <>
                <p className="text-sm text-suave">
                  Pida la autorización para ver datos de contacto y hojas de vida, y exportar listados. La Facultad verifica la existencia
                  de su organización y la persona de contacto.
                </p>
                {full?.review_note && <p className="mt-2 text-sm text-naranja">{full.review_note}</p>}
                <form action={requestAuthorization} className="mt-4">
                  <button className="btn btn-primary">
                    <Send /> Solicitar autorización
                  </button>
                </form>
              </>
            )}
            {company.status === "en_revision" && (
              <p className="flex gap-2 text-sm text-suave">
                <Clock className="h-4 w-4 shrink-0 text-amarillo-tinta" aria-hidden="true" /> Su solicitud está en revisión. Mientras tanto puede buscar perfiles anónimos.
              </p>
            )}
            {company.status === "autorizada" && (
              <p className="flex gap-2 text-sm text-suave">
                <Lock className="h-4 w-4 shrink-0 text-verde-tinta" aria-hidden="true" /> Use los datos solo para seleccionar practicantes y elimine los listados al terminar su proceso.
              </p>
            )}
            {company.status === "rechazada" && (
              <>
                <p className="flex gap-2 text-sm text-naranja">
                  <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> La solicitud no fue aprobada. {full?.review_note}
                </p>
                <form action={requestAuthorization} className="mt-4">
                  <button className="btn btn-secondary">
                    <Send /> Volver a solicitar
                  </button>
                </form>
              </>
            )}
            {company.status === "suspendida" && (
              <p className="flex gap-2 text-sm text-naranja">
                <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> El acceso de su organización está suspendido. {full?.review_note}
              </p>
            )}
          </div>
        </Reveal>

        <div className="grid gap-4">
          {[
            { href: "/empresa/buscar", icon: FileSearch, title: "Buscar perfiles", text: "Por habilidad, programa, idioma, modalidad y ciudad.", tone: "" },
            { href: "/empresa/favoritos", icon: Star, title: "Mis favoritos", text: `${favorites ?? 0} perfiles guardados para revisar.`, tone: "icon-tile-amarillo" },
            { href: "/guia/empresas", icon: BookOpen, title: "Cómo vincular a un practicante", text: "Formas de vinculación, documentos, ARL y tiempos.", tone: "icon-tile-verde" },
          ].map((l, i) => (
            <Reveal key={l.href} index={i}>
              <Link href={l.href} className="card card-hover group flex items-center gap-4">
                <span className={`icon-tile ${l.tone}`}>
                  <l.icon />
                </span>
                <span className="flex-1">
                  <span className="block font-black text-azul-oscuro">{l.title}</span>
                  <span className="text-sm text-suave">{l.text}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-suave transition-transform group-hover:translate-x-1 group-hover:text-azul" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
