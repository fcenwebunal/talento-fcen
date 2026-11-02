import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentDetailView } from "@/components/student-detail";
import { AVAILABILITY_LABEL, PAPA_VISIBILITY, formatDate } from "@/lib/labels";
import type { Availability, StudentDetail } from "@/lib/types";
import { setStudentAvailability, verifyProgress } from "../../actions";

export const metadata: Metadata = { title: "Estudiante" };
export const dynamic = "force-dynamic";

const DOC_LABEL: Record<string, string> = {
  hoja_vida: "Hoja de vida",
  historia_academica: "Historia académica",
  documento_identidad: "Documento de identidad",
  certificado_eps: "Certificado de EPS",
  foto: "Fotografía",
  certificado: "Certificado",
};

export default async function AdminStudent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data, error }, { data: priv }, { data: docs }, { data: history }, { data: papaRow }] = await Promise.all([
    supabase.rpc("get_student_detail", { p_student: id }),
    supabase.from("student_private").select("*").eq("student_id", id).single(),
    supabase.from("documents").select("kind, path, file_name, created_at").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("status_history").select("from_status, to_status, created_at").eq("entity", "student").eq("entity_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("students").select("papa").eq("id", id).single(),
  ]);
  // The CV hides the PAPA when the student chose «nadie»; staff still records it here
  const papa = papaRow?.papa as number | null | undefined;
  if (error || !data) notFound();
  const detail = data as StudentDetail;

  const signed = await Promise.all(
    (docs ?? []).map(async (d) => {
      const { data: s } = await supabase.storage.from("documentos").createSignedUrl(d.path, 600);
      return { ...d, url: s?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/estudiantes" className="no-print text-sm text-suave hover:text-azul">
        <ArrowLeft className="mr-1 inline h-4 w-4 align-[-0.2rem]" aria-hidden="true" /> Estudiantes
      </Link>

      <div className="no-print grid gap-6 lg:grid-cols-3">
        <form action={verifyProgress} className="card space-y-3">
          <input type="hidden" name="student_id" value={id} />
          <h2 className="font-black text-azul-oscuro">Verificar avance y PAPA</h2>
          <p className="text-sm text-suave">Compáralos con la historia académica y guarda los valores verificados.</p>
          <label className="field">
            <span>Avance del plan (%)</span>
            <input name="progress_pct" type="number" step="0.1" min="0" max="100" defaultValue={detail.progress_pct ?? ""} className="input" />
          </label>
          <label className="field">
            <span>PAPA (0,0 a 5,0)</span>
            <input name="papa" type="number" step="0.1" min="0" max="5" defaultValue={papa ?? ""} className="input" />
          </label>
          {detail.papa_visibility && <p className="text-xs text-suave">El estudiante muestra su PAPA a: {PAPA_VISIBILITY[detail.papa_visibility].toLowerCase()}.</p>}
          <button className="btn btn-primary">Marcar como verificado</button>
        </form>

        <form action={setStudentAvailability} className="card space-y-3">
          <input type="hidden" name="student_id" value={id} />
          <h2 className="font-black text-azul-oscuro">Estado</h2>
          <select name="availability" defaultValue={detail.availability} className="input">
            {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => (
              <option key={k} value={k}>
                {AVAILABILITY_LABEL[k]}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary">Cambiar estado</button>
          <ul className="space-y-1 text-xs text-suave">
            {(history ?? []).map((h, i) => (
              <li key={i}>
                {formatDate(h.created_at)}: {h.from_status ?? "?"} <ArrowRight className="mx-1 inline h-3 w-3 align-[-0.1rem]" aria-hidden="true" /> {h.to_status}
              </li>
            ))}
          </ul>
        </form>

        <div className="card text-sm">
          <h2 className="font-black text-azul-oscuro">Solo para la Facultad</h2>
          <dl className="mt-2 space-y-1">
            <Item k="Documento" v={[priv?.doc_type, priv?.doc_number].filter(Boolean).join(" ")} />
            <Item k="Nacimiento" v={formatDate(priv?.birth_date ?? null)} />
            <Item k="Correo personal" v={priv?.personal_email} />
            <Item k="EPS" v={priv?.eps} />
            <Item k="Emergencia" v={[priv?.emergency_name, priv?.emergency_relation, priv?.emergency_phone].filter(Boolean).join(" · ")} />
          </dl>
          <h3 className="mt-4 font-black text-azul-oscuro">Documentos</h3>
          <ul className="mt-1 space-y-1">
            {signed.map((d, i) => (
              <li key={i}>
                {d.url ? (
                  <a href={d.url} target="_blank" rel="noopener" className="text-azul-medio underline">
                    {DOC_LABEL[d.kind] ?? d.kind}
                  </a>
                ) : (
                  DOC_LABEL[d.kind]
                )}{" "}
                <span className="text-suave">· {formatDate(d.created_at)}</span>
              </li>
            ))}
            {signed.length === 0 && <li className="text-suave">Sin documentos</li>}
          </ul>
        </div>
      </div>

      <StudentDetailView detail={detail} viewer="la Facultad" photoUrl={signed.find((d) => d.kind === "foto")?.url ?? null} />
    </div>
  );
}

function Item({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-suave">{k}</dt>
      <dd className="text-right">{v || "No indicado"}</dd>
    </div>
  );
}
