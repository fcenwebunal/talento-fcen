import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AVAILABILITY_LABEL, COMPANY_STATUS_LABEL } from "@/lib/labels";
import type { Availability, CompanyStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Administración" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supabase = await createClient();
  const [{ data: students }, { data: companies }, { data: stats }, { count: exports }] = await Promise.all([
    supabase.from("students").select("availability, consent_anonymous, program_id"),
    supabase.from("companies").select("status"),
    supabase.rpc("public_stats"),
    supabase.from("exports_log").select("id", { count: "exact", head: true }),
  ]);

  const byAvailability = countBy((students ?? []).map((s) => s.availability as Availability));
  const byStatus = countBy((companies ?? []).map((c) => c.status as CompanyStatus));
  const pending = byStatus.en_revision ?? 0;
  const listed = (stats as { students_listed: number } | null)?.students_listed ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="display text-3xl text-azul-oscuro">Administración</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi value={students?.length ?? 0} label="estudiantes registrados" />
        <Kpi value={listed} label="aparecen ante empresas" />
        <Kpi value={companies?.length ?? 0} label="empresas registradas" />
        <Kpi value={exports ?? 0} label="exportaciones realizadas" />
      </div>

      {pending > 0 && (
        <Link href="/admin/empresas?estado=en_revision" className="card block border-amarillo bg-amarillo/10 hover:border-azul">
          <p className="font-bold text-amarillo-tinta">
            {pending} {pending === 1 ? "empresa espera" : "empresas esperan"} autorización
          </p>
          <p className="text-sm text-suave">Revisar solicitudes</p>
        </Link>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="font-bold text-azul-oscuro">Estudiantes por estado</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => (
              <li key={k} className="flex justify-between">
                <span>{AVAILABILITY_LABEL[k]}</span>
                <strong>{byAvailability[k] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-bold text-azul-oscuro">Empresas por estado</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {(Object.keys(COMPANY_STATUS_LABEL) as CompanyStatus[]).map((k) => (
              <li key={k} className="flex justify-between">
                <span>{COMPANY_STATUS_LABEL[k]}</span>
                <strong>{byStatus[k] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Partial<Record<T, number>>>((acc, k) => ({ ...acc, [k]: (acc[k] ?? 0) + 1 }), {});
}

function Kpi({ value, label }: { value: number; label: string }) {
  return (
    <div className="card">
      <p className="display text-3xl text-azul">{value}</p>
      <p className="text-sm text-suave">{label}</p>
    </div>
  );
}
