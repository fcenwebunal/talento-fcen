import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminTitle } from "../admin-title";
import { COMPANY_STATUS_LABEL, formatDate } from "@/lib/labels";
import type { CompanyStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Empresas" };
export const dynamic = "force-dynamic";

export default async function AdminCompanies({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("companies")
    .select("id, name, nit, city, sector, status, created_at, authorized_until, logo_path")
    .order("created_at", { ascending: false });
  if (estado) query = query.eq("status", estado);
  const { data } = await query;

  return (
    <div>
      <AdminTitle icon={Building2} title="Empresas" description="Revise solicitudes, autorice o suspenda organizaciones." />
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/empresas" className={`chip ${!estado ? "chip-azul" : ""}`}>
          Todas
        </Link>
        {(Object.keys(COMPANY_STATUS_LABEL) as CompanyStatus[]).map((k) => (
          <Link key={k} href={`/admin/empresas?estado=${k}`} className={`chip ${estado === k ? "chip-azul" : ""}`}>
            {COMPANY_STATUS_LABEL[k]}
          </Link>
        ))}
      </div>
      <div className="table-wrap mt-6">
        <table className="table-fcen">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>NIT</th>
              <th>Ciudad</th>
              <th>Estado</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/empresas/${c.id}`} className="group flex items-center gap-3">
                    <Avatar name={c.name} seed={c.id} src={c.logo_path ? supabase.storage.from("logos").getPublicUrl(c.logo_path).data.publicUrl : null} size={36} square />
                    <span>
                      <span className="block font-black text-azul-oscuro group-hover:text-azul-medio">{c.name}</span>
                      {c.sector && <span className="text-xs text-suave">{c.sector}</span>}
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 text-suave opacity-0 group-hover:opacity-100" />
                  </Link>
                </td>
                <td>{c.nit}</td>
                <td>{c.city}</td>
                <td>
                  <StatusChip status={c.status as CompanyStatus} />
                  {c.status === "autorizada" && c.authorized_until && <p className="text-xs text-suave">hasta {formatDate(c.authorized_until)}</p>}
                </td>
                <td>{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(data ?? []).length === 0 && (
        <div className="mt-6">
          <EmptyState icon={Building2} title="No hay empresas en este estado" />
        </div>
      )}
    </div>
  );
}

const CHIP: Record<CompanyStatus, string> = {
  registrada: "chip-azul",
  en_revision: "chip-amarillo",
  autorizada: "chip-verde",
  suspendida: "chip-naranja",
  rechazada: "",
};

function StatusChip({ status }: { status: CompanyStatus }) {
  return (
    <span className={`chip ${CHIP[status]}`}>
      <span className="status-dot" /> {COMPANY_STATUS_LABEL[status]}
    </span>
  );
}
