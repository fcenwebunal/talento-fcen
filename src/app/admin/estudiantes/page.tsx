import type { Metadata } from "next";
import Link from "next/link";
import { Filter, Search, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { AdminTitle } from "../admin-title";
import { AVAILABILITY_LABEL, VERIFIED_LABEL, formatDate } from "@/lib/labels";
import type { Availability } from "@/lib/types";

export const metadata: Metadata = { title: "Estudiantes" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  availability: Availability;
  progress_pct: number | null;
  progress_verified: string;
  last_confirmed_at: string | null;
  consent_anonymous: boolean;
  consent_contact: boolean;
  updated_at: string;
  profiles: { full_name: string | null; email: string; avatar_path: string | null } | null;
  programs: { name: string } | null;
};

export default async function AdminStudents({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string; verificar?: string }> }) {
  const { estado, q, verificar } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("students")
    .select("id, availability, progress_pct, progress_verified, last_confirmed_at, consent_anonymous, consent_contact, updated_at, profiles(full_name, email, avatar_path), programs(name)")
    .order("updated_at", { ascending: false })
    .limit(300);
  if (estado) query = query.eq("availability", estado);
  if (verificar) query = query.neq("progress_verified", "coordinacion").not("progress_pct", "is", null);
  const { data } = await query;
  const needle = (q ?? "").toLowerCase();
  const rows = ((data ?? []) as unknown as Row[]).filter(
    (r) => !needle || `${r.profiles?.full_name ?? ""} ${r.profiles?.email ?? ""}`.toLowerCase().includes(needle)
  );

  // Account photo first (public bucket); otherwise the profile photo document, signed in one batch
  const photos = new Map<string, string>();
  for (const r of rows) {
    if (r.profiles?.avatar_path) photos.set(r.id, supabase.storage.from("avatars").getPublicUrl(r.profiles.avatar_path).data.publicUrl);
  }
  const missing = rows.filter((r) => !photos.has(r.id)).map((r) => r.id);
  if (missing.length) {
    const { data: docs } = await supabase.from("documents").select("student_id, path").eq("kind", "foto").in("student_id", missing).order("created_at", { ascending: false });
    const latest = new Map<string, string>();
    for (const d of docs ?? []) if (!latest.has(d.student_id)) latest.set(d.student_id, d.path);
    if (latest.size) {
      const { data: signed } = await supabase.storage.from("documentos").createSignedUrls([...latest.values()], 3600);
      const byPath = new Map((signed ?? []).map((x) => [x.path, x.signedUrl]));
      for (const [id, path] of latest) {
        const url = byPath.get(path);
        if (url) photos.set(id, url);
      }
    }
  }

  return (
    <div>
      <AdminTitle icon={Users} title="Estudiantes" description={`${rows.length} perfiles con los filtros actuales`} />
      <form className="card flex flex-wrap items-center gap-3" method="get">
        <div className="input-icon max-w-xs flex-1">
          <Search aria-hidden="true" />
          <input name="q" defaultValue={q} placeholder="Nombre o correo" className="input" />
        </div>
        <select name="estado" defaultValue={estado ?? ""} className="input max-w-xs">
          <option value="">Todos los estados</option>
          {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => (
            <option key={k} value={k}>
              {AVAILABILITY_LABEL[k]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="verificar" value="1" defaultChecked={!!verificar} /> Avance por verificar
        </label>
        <button className="btn btn-primary">
          <Filter /> Filtrar
        </button>
      </form>
      <div className="table-wrap mt-6">
        <table className="table-fcen">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Programa</th>
              <th>Estado</th>
              <th>Avance</th>
              <th>Autorizaciones</th>
              <th>Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/estudiantes/${r.id}`} className="group flex items-center gap-3">
                    <Avatar name={r.profiles?.full_name ?? r.profiles?.email} seed={r.id} src={photos.get(r.id) ?? null} size={46} />
                    <span className="min-w-0">
                      <span className="block font-black text-azul-oscuro group-hover:text-azul-medio">{r.profiles?.full_name || "Sin nombre"}</span>
                      <span className="block truncate text-xs text-suave">{r.profiles?.email}</span>
                    </span>
                  </Link>
                </td>
                <td>{r.programs?.name ?? "Sin programa"}</td>
                <td>
                  <span className={`chip ${r.availability === "disponible" ? "chip-verde" : r.availability === "sin_confirmar" ? "chip-amarillo" : r.availability === "en_practica" || r.availability === "en_proceso" ? "chip-azul" : ""}`}>
                    {AVAILABILITY_LABEL[r.availability]}
                  </span>
                </td>
                <td>
                  {r.progress_pct !== null ? `${r.progress_pct}%` : "—"}
                  <p className="text-xs text-suave">{VERIFIED_LABEL[r.progress_verified]}</p>
                </td>
                <td className="text-xs">
                  {r.consent_anonymous ? "Aparece" : "No aparece"}
                  <br />
                  {r.consent_contact ? "Comparte contacto" : "Sin contacto"}
                </td>
                <td>{formatDate(r.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="mt-4 text-suave">No hay estudiantes con esos filtros.</p>}
      </div>
    </div>
  );
}
