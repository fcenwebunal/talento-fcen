import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Check, Clock, Download, Eye, Inbox, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AVAILABILITY_LABEL, COMPANY_STATUS_LABEL, formatDate } from "@/lib/labels";
import type { Availability, CompanyStatus } from "@/lib/types";
import { Stat } from "@/components/ui/stat";
import { HelpTip } from "@/components/ui/help-tip";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { ConnectionNetwork } from "@/components/ui/connect-art";
import { setCompanyStatus } from "./actions";

export const metadata: Metadata = { title: "Administración" };
export const dynamic = "force-dynamic";

const AVAIL_COLOR: Record<Availability, string> = {
  disponible: "var(--verde)",
  en_proceso: "var(--azul-medio)",
  en_practica: "var(--azul)",
  sin_confirmar: "var(--amarillo)",
  no_disponible: "var(--texto-suave)",
  archivado: "var(--borde)",
};

const STATUS_COLOR: Record<CompanyStatus, string> = {
  registrada: "var(--azul-medio)",
  en_revision: "var(--amarillo)",
  autorizada: "var(--verde)",
  suspendida: "var(--naranja)",
  rechazada: "var(--texto-suave)",
};

type ToVerify = { id: string; progress_pct: number; progress_verified: string; profiles: { full_name: string | null; avatar_path: string | null } | null; programs: { name: string } | null };

export default async function AdminHome() {
  const supabase = await createClient();
  const [{ data: students }, { data: companies }, { data: queue }, { data: toVerify }, { count: exports }, { count: views }] = await Promise.all([
    supabase.from("students").select("availability, consent_anonymous, program_id, programs(name), profiles!inner(role)").eq("profiles.role", "student"),
    supabase.from("companies").select("status"),
    supabase.from("companies").select("id, name, nit, city, sector, logo_path, created_at").eq("status", "en_revision").order("created_at").limit(6),
    supabase
      .from("students")
      .select("id, progress_pct, progress_verified, profiles!inner(full_name, avatar_path, role), programs(name)")
      .eq("profiles.role", "student")
      .neq("progress_verified", "coordinacion")
      .or("progress_pct.not.is.null,papa.not.is.null")
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase.from("exports_log").select("id", { count: "exact", head: true }),
    supabase.from("contact_events").select("id", { count: "exact", head: true }),
  ]);

  const byAvailability = countBy((students ?? []).map((s) => s.availability as Availability));
  const byStatus = countBy((companies ?? []).map((c) => c.status as CompanyStatus));
  const listed = (students ?? []).filter((s) => s.consent_anonymous && ["disponible", "en_proceso"].includes(s.availability)).length;
  const programs = countBy(((students ?? []) as unknown as { programs: { name: string } | null }[]).map((r) => r.programs?.name ?? "Sin programa"));
  const programMax = Math.max(1, ...Object.values(programs).map(Number));
  const verifyRows = (toVerify ?? []) as unknown as ToVerify[];

  return (
    <>
      <PageHeader kicker="Administración" title="Resumen" description="Lo que necesita su atención y el estado de la plataforma." art={<ConnectionNetwork className="w-48" />} />

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="card p-0">
          <header className="flex items-center justify-between border-b border-borde px-5 py-4">
            <h2 className="flex items-center gap-2 font-black text-azul-oscuro">
              <Clock className="h-4 w-4 text-amarillo-tinta" aria-hidden="true" /> Empresas por autorizar
              {(byStatus.en_revision ?? 0) > 0 && <span className="chip chip-amarillo py-0">{byStatus.en_revision}</span>}
            </h2>
            <Link href="/admin/empresas?estado=en_revision" className="text-sm font-black text-azul hover:underline">
              Ver todas
            </Link>
          </header>
          {(queue ?? []).length === 0 ? (
            <Empty text="No hay solicitudes pendientes." />
          ) : (
            <ul className="divide-y divide-borde">
              {(queue ?? []).map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Avatar name={c.name} seed={c.id} src={c.logo_path ? supabase.storage.from("logos").getPublicUrl(c.logo_path).data.publicUrl : null} size={46} square />
                  <Link href={`/admin/empresas/${c.id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-black text-azul-oscuro hover:text-azul-medio">{c.name}</span>
                    <span className="block truncate text-xs text-suave">
                      NIT {c.nit} · {c.city} · desde {formatDate(c.created_at)}
                    </span>
                  </Link>
                  <form action={setCompanyStatus} className="flex gap-1.5">
                    <input type="hidden" name="company_id" value={c.id} />
                    <button name="status" value="autorizada" className="btn btn-primary btn-sm" title="Autorizar por 12 meses">
                      <Check /> Autorizar
                    </button>
                    <Link href={`/admin/empresas/${c.id}`} className="btn btn-secondary btn-sm" title="Revisar y decidir con nota">
                      <X /> Revisar
                    </Link>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-0">
          <header className="flex items-center justify-between border-b border-borde px-5 py-4">
            <h2 className="flex items-center gap-2 font-black text-azul-oscuro">
              <BadgeCheck className="h-4 w-4 text-verde-tinta" aria-hidden="true" /> Avances por verificar
              <HelpTip>Compare el avance y el PAPA declarados con la historia académica que subió el estudiante.</HelpTip>
            </h2>
            <Link href="/admin/estudiantes?verificar=1" className="text-sm font-black text-azul hover:underline">
              Ver todos
            </Link>
          </header>
          {verifyRows.length === 0 ? (
            <Empty text="Todos los avances están verificados." />
          ) : (
            <ul className="divide-y divide-borde">
              {verifyRows.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/estudiantes/${r.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-celeste/60">
                    <Avatar name={r.profiles?.full_name} seed={r.id} src={r.profiles?.avatar_path ? supabase.storage.from("avatars").getPublicUrl(r.profiles.avatar_path).data.publicUrl : null} size={46} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-black text-azul-oscuro">{r.profiles?.full_name ?? "Sin nombre"}</span>
                      <span className="block truncate text-xs text-suave">{r.programs?.name}</span>
                    </span>
                    <span className="chip chip-azul">{r.progress_pct}%</span>
                    <ArrowRight className="h-4 w-4 text-suave" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} value={students?.length ?? 0} label="estudiantes registrados" />
        <Stat icon={Eye} value={listed} label="aparecen ante empresas" tone="verde" />
        <Stat icon={Building2} value={companies?.length ?? 0} label="empresas registradas" tone="amarillo" />
        <Stat icon={Download} value={exports ?? 0} label="exportaciones" tone="naranja" hint={`${views ?? 0} consultas de contacto y descargas`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="card">
          <h2 className="font-black text-azul-oscuro">Estudiantes por estado</h2>
          <StackedBar parts={(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => ({ value: byAvailability[k] ?? 0, color: AVAIL_COLOR[k] }))} />
          <Legend labels={AVAILABILITY_LABEL} counts={byAvailability} colors={AVAIL_COLOR} />
        </section>
        <section className="card">
          <h2 className="font-black text-azul-oscuro">Empresas por estado</h2>
          <StackedBar parts={(Object.keys(COMPANY_STATUS_LABEL) as CompanyStatus[]).map((k) => ({ value: byStatus[k] ?? 0, color: STATUS_COLOR[k] }))} />
          <Legend labels={COMPANY_STATUS_LABEL} counts={byStatus} colors={STATUS_COLOR} />
        </section>
        <section className="card">
          <h2 className="font-black text-azul-oscuro">Estudiantes por programa</h2>
          <ul className="mt-4 space-y-2">
            {Object.entries(programs)
              .sort((a, b) => Number(b[1]) - Number(a[1]))
              .map(([name, n]) => (
                <li key={name} className="text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="truncate">{name}</span>
                    <strong>{n}</strong>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-superficie-2">
                    <div className="h-full rounded-full bg-azul-medio" style={{ width: `${(Number(n) / programMax) * 100}%` }} />
                  </div>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Partial<Record<T, number>>>((acc, k) => ({ ...acc, [k]: (acc[k] ?? 0) + 1 }), {});
}

function Empty({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-3 px-5 py-8 text-sm text-suave">
      <Inbox className="h-5 w-5" aria-hidden="true" /> {text}
    </p>
  );
}

function StackedBar({ parts }: { parts: { value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-superficie-2">
      {parts.filter((p) => p.value > 0).map((p, i) => (
        <span key={i} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
      ))}
    </div>
  );
}

function Legend<T extends string>({ labels, counts, colors }: { labels: Record<T, string>; counts: Partial<Record<T, number>>; colors: Record<T, string> }) {
  return (
    <ul className="mt-4 space-y-1.5 text-sm">
      {(Object.keys(labels) as T[]).map((k) => (
        <li key={k} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[k] }} />
          <span className="flex-1">{labels[k]}</span>
          <strong>{counts[k] ?? 0}</strong>
        </li>
      ))}
    </ul>
  );
}
