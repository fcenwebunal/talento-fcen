import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, Clock, MapPin, Wallet } from "lucide-react";
import { MODALITY_LABEL } from "@/lib/labels";
import { type CallWithRelations, callPrograms, deadlineText, formatLongDate, isOpen, todayCo } from "@/lib/calls";

// Logos are standardized on a white tile: PNG without background or on white
export function CallLogo({ url, name, size = "md" }: { url: string | null; name: string; size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-24 w-24 p-2.5" : "h-16 w-16 p-1.5";
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] border border-borde bg-white ${box}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- public Storage URL of any size
        <img src={url} alt={`Logo de ${name}`} className="max-h-full max-w-full object-contain" />
      ) : (
        <Building2 className="h-1/2 w-1/2 text-azul-medio" aria-hidden="true" />
      )}
    </span>
  );
}

export function CallCard({ call, logoUrl, href, footer }: { call: CallWithRelations; logoUrl: string | null; href: string; footer?: React.ReactNode }) {
  const today = todayCo();
  const open = isOpen(call, today);
  const programs = callPrograms(call);

  return (
    <article className="card card-hover relative flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <CallLogo url={logoUrl} name={call.company_name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black uppercase tracking-widest text-suave">{call.company_name}</p>
          <h2 className="display mt-0.5 text-lg leading-snug text-azul-oscuro">
            <Link href={href} className="after:absolute after:inset-0 hover:underline">
              {call.title}
            </Link>
          </h2>
          {call.company_brand && <p className="text-sm text-suave">{call.company_brand}</p>}
        </div>
      </div>

      {programs.length > 0 && (
        <p className="text-sm">
          <span className="text-suave">Para estudiantes de: </span>
          <strong className="text-azul-oscuro">{programs.join(", ")}</strong>
        </p>
      )}
      {call.summary && <p className="line-clamp-3 text-sm text-suave">{call.summary}</p>}

      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`chip ${call.paid ? "chip-verde" : ""}`}>
          <Wallet className="h-3.5 w-3.5" aria-hidden="true" /> {call.paid ? "Con apoyo económico" : "Sin apoyo económico"}
        </span>
        {call.duration_months && (
          <span className="chip">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {call.duration_months} {call.duration_months === 1 ? "mes" : "meses"}
          </span>
        )}
        {(call.city || call.modality) && (
          <span className="chip">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {[call.city, call.modality ? MODALITY_LABEL[call.modality] : null].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-borde pt-3 text-sm">
        <span className="flex items-center gap-2">
          <CalendarClock className={`h-4 w-4 ${open ? "text-verde-tinta" : "text-suave"}`} aria-hidden="true" />
          <span>
            <span className="text-suave">Fecha límite: </span>
            <strong className="text-azul-oscuro">{formatLongDate(call.deadline)}</strong>
            {open && <span className="ml-2 text-xs font-black text-verde-tinta">{deadlineText(call.deadline, today)}</span>}
            {!open && call.status !== "borrador" && <span className="ml-2 text-xs font-black text-suave">Cerrada</span>}
          </span>
        </span>
        {footer ? (
          <span className="relative z-10 flex flex-wrap items-center gap-2">{footer}</span>
        ) : (
          <span className="inline-flex items-center gap-1 font-black text-azul">
            Ver convocatoria <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </article>
  );
}
