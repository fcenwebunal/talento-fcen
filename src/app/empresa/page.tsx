import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Building2, Check, Clock, Download, Eye, Search, Send, Star, Users, XCircle } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { studentPhotoUrls } from "@/lib/photos";
import { COMPANY_STATUS_LABEL, formatDate } from "@/lib/labels";
import type { StudentDetail } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { HelpTip } from "@/components/ui/help-tip";
import { Avatar } from "@/components/ui/avatar";
import { Counter } from "@/components/ui/counter";
import { PuzzleMatch } from "@/components/ui/connect-art";
import { requestAuthorization } from "./actions";

export const metadata: Metadata = { title: "Mi espacio" };
export const dynamic = "force-dynamic";

const QUICK = ["Python", "Análisis de datos", "Instrumentación", "Bioprocesos", "Estadística", "Desarrollo web"];

export default async function CompanyHome() {
  const session = await requireRole(["company"]);
  if (!session.company) redirect("/empresa/registro");
  const company = session.company;
  const supabase = await createClient();
  const [{ data: full }, { data: favs, count: favCount }, { count: views }, { count: exportsCount }, { data: stats }] = await Promise.all([
    supabase.from("companies").select("review_note, logo_path, sector, city").eq("id", company.id).single(),
    supabase.from("favorites").select("student_id", { count: "exact" }).eq("company_id", company.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("contact_events").select("id", { count: "exact", head: true }).eq("company_id", company.id),
    supabase.from("exports_log").select("id", { count: "exact", head: true }).eq("company_id", company.id),
    supabase.rpc("public_stats"),
  ]);
  const listed = (stats as { students_listed: number } | null)?.students_listed ?? 0;
  const logo = full?.logo_path ? supabase.storage.from("logos").getPublicUrl(full.logo_path).data.publicUrl : null;
  const recent = await Promise.all(
    (favs ?? []).map(async (f) => {
      const { data } = await supabase.rpc("get_student_detail", { p_student: f.student_id });
      return { id: f.student_id, d: data as StudentDetail | null };
    })
  );
  const photos = await studentPhotoUrls(supabase, recent.filter((x) => x.d?.contact_visible).map((x) => x.id));

  const steps = [
    { label: "Registrada", icon: Building2, done: true },
    { label: "En revisión", icon: Clock, done: ["en_revision", "autorizada"].includes(company.status) },
    { label: "Autorizada", icon: BadgeCheck, done: company.status === "autorizada" },
  ];

  return (
    <>
      <PageHeader
        kicker={[full?.sector, full?.city].filter(Boolean).join(" · ") || "Mi espacio"}
        title={company.name}
        description={
          <span className={`chip mt-1 ${company.status === "autorizada" ? "chip-verde" : company.status === "en_revision" ? "chip-amarillo" : ""}`}>
            <span className={`status-dot ${company.status === "autorizada" ? "live" : ""}`} />
            {COMPANY_STATUS_LABEL[company.status]}
            {company.status === "autorizada" && company.authorized_until ? ` hasta el ${formatDate(company.authorized_until)}` : ""}
          </span>
        }
        actions={
          <Link href="/empresa/buscar" className="btn btn-primary">
            <Search /> Buscar talento
          </Link>
        }
        art={<Avatar name={company.name} seed={company.id} src={logo} size={52} square />}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="card overflow-hidden p-6 xl:col-span-2">
          <span className="accent-bar" />
          <div className="flex flex-wrap items-center justify-between gap-6">
            <form action="/empresa/buscar" method="get" className="min-w-0 max-w-xl flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-verde-tinta">Encuentre a su practicante</p>
              <h2 className="display mt-1 text-2xl text-azul-oscuro">
                <Counter value={listed} /> perfiles buscan práctica hoy
              </h2>
              <div className="mt-4 flex gap-2">
                <div className="input-icon flex-1">
                  <Search aria-hidden="true" />
                  <input name="q" className="input" placeholder="¿Qué habilidad necesita? Ej.: series de tiempo" />
                </div>
                <button className="btn btn-primary">Buscar</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <Link key={q} href={`/empresa/buscar?q=${encodeURIComponent(q)}`} className="chip">
                    {q}
                  </Link>
                ))}
              </div>
            </form>
            <PuzzleMatch className="hidden w-44 sm:block" />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-black text-azul-oscuro">
            Autorización
            <HelpTip align="right">Con la autorización ve nombre, contacto y hoja de vida de quienes lo permitieron, y puede exportar listados. Dura 12 meses.</HelpTip>
          </h2>
          <ol className="mt-5 flex items-center">
            {steps.map((s, i) => (
              <li key={s.label} className="flex flex-1 items-center last:flex-none">
                <span className="flex flex-col items-center gap-1">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] ${s.done ? "bg-verde text-white" : "bg-superficie-2 text-suave"}`}>
                    {s.done ? <Check className="h-4 w-4" strokeWidth={3} /> : <s.icon className="h-4 w-4" />}
                  </span>
                  <span className={`text-[0.6875rem] font-black ${s.done ? "text-verde-tinta" : "text-suave"}`}>{s.label}</span>
                </span>
                {i < steps.length - 1 && <span className={`mx-1.5 mb-4 h-0.5 flex-1 rounded ${steps[i + 1].done ? "bg-verde" : "bg-borde"}`} />}
              </li>
            ))}
          </ol>
          <div className="mt-5 border-t border-borde pt-4 text-sm">
            {company.status === "registrada" && (
              <form action={requestAuthorization}>
                {full?.review_note && <p className="mb-2 text-naranja">{full.review_note}</p>}
                <button className="btn btn-primary w-full">
                  <Send /> Solicitar autorización
                </button>
              </form>
            )}
            {company.status === "en_revision" && <p className="text-suave">La Facultad está revisando su solicitud. Mientras tanto ve perfiles anónimos.</p>}
            {company.status === "autorizada" && <p className="text-suave">Use los datos solo para seleccionar practicantes y elimine los listados al terminar.</p>}
            {company.status === "rechazada" && (
              <form action={requestAuthorization} className="space-y-2">
                <p className="flex gap-2 text-naranja">
                  <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {full?.review_note ?? "La solicitud no fue aprobada."}
                </p>
                <button className="btn btn-secondary w-full">
                  <Send /> Volver a solicitar
                </button>
              </form>
            )}
            {company.status === "suspendida" && (
              <p className="flex gap-2 text-naranja">
                <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {full?.review_note ?? "Acceso suspendido."}
              </p>
            )}
          </div>
        </section>

        <section className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-black text-azul-oscuro">
              <Star className="h-4 w-4 text-amarillo" aria-hidden="true" /> Favoritos recientes
            </h2>
            <Link href="/empresa/favoritos" className="text-sm font-black text-azul hover:underline">
              Ver todos ({favCount ?? 0})
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-suave">Guarde perfiles con la estrella para compararlos aquí.</p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {recent.map(({ id, d }) =>
                d ? (
                  <li key={id}>
                    <Link href={`/empresa/estudiantes/${id}`} className="flex items-center gap-3 rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] border border-borde p-3 transition-colors hover:border-azul hover:bg-celeste">
                      <Avatar name={d.contact?.full_name ?? d.program} seed={id} src={photos.get(id) ?? null} size={38} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-azul-oscuro">{d.contact?.full_name ?? d.headline ?? "Perfil"}</span>
                        <span className="block truncate text-xs text-suave">{d.program}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-suave" />
                    </Link>
                  </li>
                ) : null
              )}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-black text-azul-oscuro">Actividad</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { icon: Users, label: "Perfiles disponibles", value: listed },
              { icon: Star, label: "Favoritos", value: favCount ?? 0 },
              { icon: Eye, label: "Contactos consultados", value: views ?? 0 },
              { icon: Download, label: "Exportaciones", value: exportsCount ?? 0 },
            ].map((r) => (
              <li key={r.label} className="flex items-center gap-3">
                <span className="icon-tile h-8 w-8">
                  <r.icon className="!h-4 !w-4" />
                </span>
                <span className="flex-1 text-suave">{r.label}</span>
                <strong className="display text-lg text-azul-oscuro">
                  <Counter value={r.value} />
                </strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
