import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, filtersFrom, toQuery, type SearchParams } from "@/lib/search";
import { SearchFilters } from "@/components/search-filters";
import { ResultCard } from "@/components/result-card";
import type { SearchRow } from "@/lib/types";

export const metadata: Metadata = { title: "Buscar talento" };
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireRole(["company"]);
  if (!session.company) redirect("/empresa/registro");
  if (session.level < 1) redirect("/empresa");

  const params = await searchParams;
  const filters = filtersFrom(params);
  const { page, include_unlisted: _ignored, ...rpcFilters } = filters;
  const supabase = await createClient();

  const [{ data, error }, programs, skills, areas] = await Promise.all([
    supabase.rpc("search_students", { p_filters: rpcFilters }),
    supabase.from("programs").select("id, name, level, department").eq("active", true).order("sort"),
    supabase.from("skills").select("id, name, domain_id").eq("active", true).order("name"),
    supabase.from("areas").select("id, name").eq("active", true).order("sort"),
  ]);

  const rows = (data ?? []) as SearchRow[];
  const total = rows[0]?.total_count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="wrap py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl text-azul-oscuro">Buscar talento</h1>
          <p className="mt-1 text-suave">
            {total} {total === 1 ? "perfil" : "perfiles"}
            {session.level < 2 && " · Vista anónima: solicite la autorización para ver los datos de contacto"}
          </p>
        </div>
        {session.level === 2 && total > 0 && (
          <a href={`/empresa/exportar?${toQuery(params, { pagina: null })}`} className="btn btn-secondary">
            Exportar a CSV
          </a>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <SearchFilters
          action="/empresa/buscar"
          initial={filters}
          programs={programs.data ?? []}
          skills={skills.data ?? []}
          areas={areas.data ?? []}
        />
        <div>
          {error && <p className="card text-naranja">No se pudo buscar. {error.message}</p>}
          {!error && rows.length === 0 && (
            <div className="card text-center text-suave">
              <p className="font-bold text-azul-oscuro">No hay perfiles con esos filtros.</p>
              <p className="mt-1 text-sm">Pruebe con menos habilidades o sin la ciudad.</p>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <ResultCard key={row.student_id} row={row} href={`/empresa/estudiantes/${row.student_id}`} highlight={filters.skill_ids} />
            ))}
          </div>
          {pages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link className="btn btn-secondary" href={`/empresa/buscar?${toQuery(params, { pagina: String(page - 1) })}`}>
                  Anterior
                </Link>
              )}
              <span className="text-sm text-suave">
                Página {page} de {pages}
              </span>
              {page < pages && (
                <Link className="btn btn-secondary" href={`/empresa/buscar?${toQuery(params, { pagina: String(page + 1) })}`}>
                  Siguiente
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
