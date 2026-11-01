import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Clock, Download, Eye, LayoutDashboard, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AVAILABILITY_LABEL, COMPANY_STATUS_LABEL } from "@/lib/labels";
import type { Availability, CompanyStatus } from "@/lib/types";
import { Stat } from "@/components/ui/stat";
import { Reveal } from "@/components/ui/reveal";
import { HelpTip } from "@/components/ui/help-tip";
import { AdminTitle } from "./admin-title";

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

export default async function AdminHome() {
  const supabase = await createClient();
  const [{ data: students }, { data: companies }, { data: stats }, { count: exports }, { count: views }, { data: byProgram }] = await Promise.all([
    supabase.from("students").select("availability, consent_anonymous, program_id, progress_verified, progress_pct"),
    supabase.from("companies").select("status"),
    supabase.rpc("public_stats"),
    supabase.from("exports_log").select("id", { count: "exact", head: true }),
    supabase.from("contact_events").select("id", { count: "exact", head: true }),
    supabase.from("students").select("programs(name)"),
  ]);

  const byAvailability = countBy((students ?? []).map((s) => s.availability as Availability));
  const byStatus = countBy((companies ?? []).map((c) => c.status as CompanyStatus));
  const pending = byStatus.en_revision ?? 0;
  const toVerify = (students ?? []).filter((s) => s.progress_pct !== null && s.progress_verified !== "coordinacion").length;
  const listed = (stats as { students_listed: number } | null)?.students_listed ?? 0;
  const programs = countBy(((byProgram ?? []) as unknown as { programs: { name: string } | null }[]).map((r) => r.programs?.name ?? "Sin programa"));
  const programMax = Math.max(1, ...Object.values(programs).map(Number));
  const totalStudents = students?.length ?? 0;
  const totalCompanies = companies?.length ?? 0;

  return (
    <div className="space-y-6">
      <AdminTitle icon={LayoutDashboard} title="Resumen" description="El estado de la plataforma de un vistazo." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Reveal><Stat icon={Users} value={totalStudents} label="estudiantes registrados" /></Reveal>
        <Reveal index={1}><Stat icon={Eye} value={listed} label="aparecen ante empresas" tone="verde" /></Reveal>
        <Reveal index={2}><Stat icon={Building2} value={totalCompanies} label="empresas registradas" tone="amarillo" /></Reveal>
        <Reveal index={3}><Stat icon={Download} value={exports ?? 0} label="exportaciones" tone="naranja" hint={`${views ?? 0} consultas de contacto y descargas`} /></Reveal>
      </div>

      {(pending > 0 || toVerify > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {pending > 0 && (
            <Link href="/admin/empresas?estado=en_revision" className="card card-hover group flex items-center gap-4 border-amarillo/60">
              <span className="icon-tile icon-tile-amarillo"><Clock /></span>
              <span className="flex-1">
                <span className="block font-black text-azul-oscuro">{pending} {pending === 1 ? "empresa espera" : "empresas esperan"} autorización</span>
                <span className="text-sm text-suave">Revisar solicitudes</span>
              </span>
              <ArrowRight className="h-4 w-4 text-suave group-hover:translate-x-1" />
            </Link>
          )}
          {toVerify > 0 && (
            <Link href="/admin/estudiantes?verificar=1" className="card card-hover group flex items-center gap-4">
              <span className="icon-tile icon-tile-verde"><BadgeCheck /></span>
              <span className="flex-1">
                <span className="block font-black text-azul-oscuro">{toVerify} avances por verificar</span>
                <span className="text-sm text-suave">Comparar con la historia académica</span>
              </span>
              <ArrowRight className="h-4 w-4 text-suave group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal className="card">
          <h2 className="flex items-center gap-2 font-black text-azul-oscuro">
            Estudiantes por estado
            <HelpTip>«Sin confirmar»: pasaron 90 días sin que el estudiante confirmara que sigue buscando.</HelpTip>
          </h2>
          <StackedBar parts={(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => ({ value: byAvailability[k] ?? 0, color: AVAIL_COLOR[k] }))} />
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => (
              <li key={k} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: AVAIL_COLOR[k] }} />
                <span className="flex-1">{AVAILABILITY_LABEL[k]}</span>
                <strong>{byAvailability[k] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal index={1} className="card">
          <h2 className="font-black text-azul-oscuro">Empresas por estado</h2>
          <StackedBar parts={(Object.keys(COMPANY_STATUS_LABEL) as CompanyStatus[]).map((k) => ({ value: byStatus[k] ?? 0, color: STATUS_COLOR[k] }))} />
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {(Object.keys(COMPANY_STATUS_LABEL) as CompanyStatus[]).map((k) => (
              <li key={k} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[k] }} />
                <span className="flex-1">{COMPANY_STATUS_LABEL[k]}</span>
                <strong>{byStatus[k] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="card lg:col-span-2">
          <h2 className="font-black text-azul-oscuro">Estudiantes por programa</h2>
          <ul className="mt-4 space-y-2.5">
            {Object.entries(programs)
              .sort((a, b) => Number(b[1]) - Number(a[1]))
              .map(([name, n]) => (
                <li key={name} className="grid grid-cols-[minmax(0,14rem)_1fr_2rem] items-center gap-3 text-sm">
                  <span className="truncate">{name}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-superficie-2">
                    <span className="block h-full rounded-full bg-[linear-gradient(90deg,var(--azul),var(--azul-medio))]" style={{ width: `${(Number(n) / programMax) * 100}%` }} />
                  </span>
                  <strong className="text-right">{n}</strong>
                </li>
              ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Partial<Record<T, number>>>((acc, k) => ({ ...acc, [k]: (acc[k] ?? 0) + 1 }), {});
}

function StackedBar({ parts }: { parts: { value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-superficie-2">
      {parts.filter((p) => p.value > 0).map((p, i) => (
        <span key={i} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
      ))}
    </div>
  );
}
