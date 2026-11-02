import type { Metadata } from "next";
import { Download, FileSpreadsheet, FileText, Filter, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { collectStudents, filtersFrom } from "@/lib/collect";
import { SKILL_LEVEL } from "@/lib/labels";
import { AdminTitle } from "../admin-title";

export const metadata: Metadata = { title: "Recoger datos" };
export const dynamic = "force-dynamic";

export default async function CollectPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const filters = filtersFrom(params);
  const supabase = await createClient();
  const [students, { data: programs }, { data: skills }] = await Promise.all([
    collectStudents(supabase, filters),
    supabase.from("programs").select("id, name").eq("active", true).order("sort"),
    supabase.from("skills").select("id, name").eq("active", true).eq("status", "approved").order("name"),
  ]);
  const withContact = students.filter((s) => s.name).length;
  const query = new URLSearchParams({
    estado: filters.estado,
    ...(filters.programa ? { programa: String(filters.programa), programaNombre: programs?.find((p) => p.id === filters.programa)?.name ?? "" } : {}),
    ...(filters.habilidad ? { habilidad: String(filters.habilidad), habilidadNombre: skills?.find((k) => k.id === filters.habilidad)?.name ?? "" } : {}),
  });

  return (
    <div className="space-y-6">
      <AdminTitle
        icon={Download}
        title="Recoger datos"
        description="Un resumen de los estudiantes que las empresas pueden ver, con sus habilidades y datos básicos, para enviarlo en CSV o PDF."
      />

      <form className="card flex flex-wrap items-end gap-3" method="get">
        <label className="field min-w-48 flex-1">
          <span>Programa</span>
          <select name="programa" defaultValue={filters.programa ?? ""} className="input">
            <option value="">Todos</option>
            {(programs ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Estado</span>
          <select name="estado" defaultValue={filters.estado} className="input">
            <option value="disponible">Disponibles</option>
            <option value="en_proceso">En proceso con una empresa</option>
            <option value="todos">Ambos</option>
          </select>
        </label>
        <label className="field min-w-48 flex-1">
          <span>Con la habilidad</span>
          <select name="habilidad" defaultValue={filters.habilidad ?? ""} className="input">
            <option value="">Cualquiera</option>
            {(skills ?? []).map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-secondary">
          <Filter /> Filtrar
        </button>
      </form>

      <div className="card flex flex-wrap items-center gap-4">
        <div className="flex-1">
          <p className="display text-2xl text-azul-oscuro">
            {students.length} {students.length === 1 ? "estudiante" : "estudiantes"}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-suave">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            {withContact} con nombre y correo (aceptaron compartir su contacto); {students.length - withContact} como perfil anónimo.
          </p>
        </div>
        <a href={`/admin/recoger/exportar?${query}&formato=csv`} download className={`btn btn-secondary ${students.length ? "" : "pointer-events-none opacity-50"}`}>
          <FileSpreadsheet /> Descargar CSV
        </a>
        <a href={`/admin/recoger/exportar?${query}&formato=pdf`} download className={`btn btn-primary ${students.length ? "" : "pointer-events-none opacity-50"}`}>
          <FileText /> Descargar PDF
        </a>
      </div>

      {students.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-borde bg-superficie text-[0.6875rem] font-black uppercase tracking-widest text-suave">
              <tr>
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Programa</th>
                <th className="px-4 py-3">Avance</th>
                <th className="px-4 py-3">Habilidades principales</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 25).map((s) => (
                <tr key={s.id} className="border-b border-borde last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-black text-azul-oscuro">{s.name ?? "Perfil anónimo"}</span>
                    <span className="block text-xs text-suave">{s.email ?? s.availability}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.program}
                    <span className="block text-xs text-suave">{s.level}</span>
                  </td>
                  <td className="px-4 py-3">{s.progress !== null ? `${s.progress} %` : "Sin dato"}</td>
                  <td className="px-4 py-3 text-xs">
                    {s.skills
                      .slice(0, 5)
                      .map((k) => `${k.name} (${SKILL_LEVEL[k.level].toLowerCase()})`)
                      .join(", ")}
                    {s.skills.length > 5 && <span className="text-suave"> y {s.skills.length - 5} más</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length > 25 && <p className="border-t border-borde px-4 py-3 text-xs text-suave">Vista previa de 25; los archivos incluyen a los {students.length}.</p>}
        </div>
      )}
    </div>
  );
}
