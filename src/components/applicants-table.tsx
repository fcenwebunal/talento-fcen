import Link from "next/link";
import { CircleAlert, CircleCheck, Download, FileSpreadsheet, Inbox, Save } from "lucide-react";
import { formatDate, VERIFIED_LABEL } from "@/lib/labels";
import { APPLICATION_STATUS_CHIP, APPLICATION_STATUS_LABEL, type Applicant, type ApplicationStatus } from "@/lib/calls";
import { DownloadButton } from "./ui/download-button";
import { EmptyState } from "./ui/empty-state";

const STAFF_STATUSES: ApplicationStatus[] = ["recibida", "en_revision", "enviada", "seleccionada", "no_seleccionada", "retirada"];

export function ApplicantsTable({
  callId,
  applicants,
  mode,
  profileHref,
  setStatus,
}: {
  callId: string;
  applicants: Applicant[];
  mode: "staff" | "company";
  profileHref: (studentId: string) => string;
  setStatus?: (formData: FormData) => Promise<void>;
}) {
  if (applicants.length === 0) {
    return <EmptyState icon={Inbox} title="Aún no hay postulantes" text="Cuando un estudiante se postule, aparecerá aquí con su hoja de vida." />;
  }

  const counts = applicants.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.status]: (acc[a.status] ?? 0) + 1 }), {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(counts).map(([status, n]) => (
            <span key={status} className={`chip ${APPLICATION_STATUS_CHIP[status as ApplicationStatus]}`}>
              {APPLICATION_STATUS_LABEL[status as ApplicationStatus]}: {n}
            </span>
          ))}
        </div>
        <DownloadButton href={`/convocatorias/${callId}/postulantes`} icon={<FileSpreadsheet />} className="btn-secondary btn-sm">
          Descargar lista (CSV)
        </DownloadButton>
      </div>

      <ul className="space-y-3">
        {applicants.map((a) => (
          <li key={a.id} className="card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={profileHref(a.student_id)} className="font-black text-azul-oscuro hover:underline">
                  {a.full_name ?? a.email}
                </Link>
                {a.headline && <p className="text-sm text-suave">{a.headline}</p>}
                <p className="mt-1 text-xs text-suave">
                  {[a.program, a.progress_pct !== null ? `avance ${String(a.progress_pct).replace(".", ",")} % (${VERIFIED_LABEL[a.progress_verified] ?? a.progress_verified})` : null, a.papa !== null ? `PAPA ${String(a.papa).replace(".", ",")}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="text-xs text-suave">{[a.email, a.phone, a.city].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs">
                <span className={`chip ${APPLICATION_STATUS_CHIP[a.status]}`}>{APPLICATION_STATUS_LABEL[a.status]}</span>
                <span className="text-suave">Se postuló el {formatDate(a.created_at)}</span>
                <span className={`flex items-center gap-1 font-black ${a.meets_requirements ? "text-verde-tinta" : "text-naranja"}`}>
                  {a.meets_requirements ? <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
                  {a.meets_requirements ? "Cumple los requisitos" : "No cumple todos los requisitos"}
                </span>
              </div>
            </div>

            {a.message && <p className="whitespace-pre-line rounded-lg bg-superficie p-3 text-sm text-texto">{a.message}</p>}

            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-borde pt-3">
              <span className="flex flex-wrap gap-2">
                <Link href={profileHref(a.student_id)} className="btn btn-ghost btn-sm">
                  Ver hoja de vida
                </Link>
                <DownloadButton href={`/cv/${a.student_id}`} icon={<Download />} className="btn-ghost btn-sm">
                  CV en PDF
                </DownloadButton>
              </span>
              {mode === "staff" && setStatus && (
                <form action={setStatus} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="application_id" value={a.id} />
                  <input type="hidden" name="call_id" value={callId} />
                  <label className="field">
                    <span className="sr-only">Estado</span>
                    <select name="status" defaultValue={a.status} className="input py-1.5 text-sm">
                      {STAFF_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {APPLICATION_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field min-w-56">
                    <span className="sr-only">Nota interna</span>
                    <input name="staff_note" defaultValue={a.staff_note ?? ""} maxLength={1000} placeholder="Nota interna (solo la Facultad)" className="input py-1.5 text-sm" />
                  </label>
                  <button className="btn btn-primary btn-sm">
                    <Save /> Guardar
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
