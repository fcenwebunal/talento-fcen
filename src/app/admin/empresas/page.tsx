import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_STATUS_LABEL, formatDate } from "@/lib/labels";
import type { CompanyStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Empresas" };
export const dynamic = "force-dynamic";

export default async function AdminCompanies({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("companies")
    .select("id, name, nit, city, sector, status, created_at, authorized_until")
    .order("created_at", { ascending: false });
  if (estado) query = query.eq("status", estado);
  const { data } = await query;

  return (
    <div>
      <h1 className="display text-3xl text-azul-oscuro">Empresas</h1>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/empresas" className={`chip ${!estado ? "chip-azul" : ""}`}>
          Todas
        </Link>
        {(Object.keys(COMPANY_STATUS_LABEL) as CompanyStatus[]).map((k) => (
          <Link key={k} href={`/admin/empresas?estado=${k}`} className={`chip ${estado === k ? "chip-azul" : ""}`}>
            {COMPANY_STATUS_LABEL[k]}
          </Link>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto">
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
                  <Link href={`/admin/empresas/${c.id}`} className="font-bold text-azul-medio underline underline-offset-2">
                    {c.name}
                  </Link>
                  {c.sector && <p className="text-xs text-suave">{c.sector}</p>}
                </td>
                <td>{c.nit}</td>
                <td>{c.city}</td>
                <td>
                  {COMPANY_STATUS_LABEL[c.status as CompanyStatus]}
                  {c.status === "autorizada" && c.authorized_until && <p className="text-xs text-suave">hasta {formatDate(c.authorized_until)}</p>}
                </td>
                <td>{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(data ?? []).length === 0 && <p className="mt-4 text-suave">No hay empresas en este estado.</p>}
      </div>
    </div>
  );
}
