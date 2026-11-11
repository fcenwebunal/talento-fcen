import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, EyeOff, Lock, SearchX, Users } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, filtersFrom, toQuery, type SearchParams } from "@/lib/search";
import { SearchFilters } from "@/components/search-filters";
import { ResultCard } from "@/components/result-card";
import { studentPhotoUrls } from "@/lib/photos";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpTip } from "@/components/ui/help-tip";
import { DownloadButton } from "@/components/ui/download-button";
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
    supabase.from("programs").select("id, name, level, department").eq("active", true).eq("level", "pregrado").order("sort"),
    supabase.from("skills").select("id, name, domain_id").eq("active", true).eq("status", "approved").order("name"),
    supabase.from("areas").select("id, name").eq("active", true).order("sort"),
  ]);

  const rows = (data ?? []) as SearchRow[];
  const total = rows[0]?.total_count ?? 0;
  const photos = await studentPhotoUrls(supabase, rows.filter((r) => r.contact_visible).map((r) => r.student_id));
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <PageHeader
        kicker={session.company.name}
        icon={Users}
        title="Buscar talento"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="chip chip-azul">
              <Users /> {total} {total === 1 ? "perfil" : "perfiles"}
            </span>
            {session.level < 2 ? (
              <span className="chip chip-azul">
                <EyeOff /> Vista anónima
                <HelpTip>Solicite la autorización de la Facultad en «Mi empresa» para ver nombres, contacto y hojas de vida.</HelpTip>
              </span>
            ) : (
              <span className="chip chip-azul">
                <Lock /> Empresa autorizada
              </span>
            )}
          </span>
        }
        actions={
          session.level === 2 &&
          total > 0 && (
            <DownloadButton href={`/empresa/exportar?${toQuery(params, { pagina: null })}`} icon={<Download />} className="btn-accent">
              Exportar a CSV
            </DownloadButton>
          )
        }
      />

      <div className="wrap grid grid-cols-1 gap-6 lg:grid-cols-[19rem_1fr]">
        <SearchFilters action="/empresa/buscar" initial={filters} programs={programs.data ?? []} skills={skills.data ?? []} areas={areas.data ?? []} />
        <div className="min-w-0">
          {error && <p className="card text-naranja">No se pudo buscar. {error.message}</p>}
          {!error && rows.length === 0 && (
            <EmptyState icon={SearchX} title="No hay perfiles con esos filtros" text="Pruebe con menos habilidades, otro nivel o sin la ciudad." action={<a href="/empresa/buscar" className="btn btn-secondary">Ver todos</a>} />
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {rows.map((row, i) => (
              <ResultCard key={row.student_id} row={row} index={i} href={`/empresa/estudiantes/${row.student_id}`} highlight={filters.skill_ids} photoUrl={photos.get(row.student_id)} />
            ))}
          </div>
          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-3">
              {page > 1 && (
                <Link className="btn btn-secondary" href={`/empresa/buscar?${toQuery(params, { pagina: String(page - 1) })}`}>
                  <ChevronLeft /> Anterior
                </Link>
              )}
              <span className="chip">
                Página {page} de {pages}
              </span>
              {page < pages && (
                <Link className="btn btn-secondary" href={`/empresa/buscar?${toQuery(params, { pagina: String(page + 1) })}`}>
                  Siguiente <ChevronRight />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
