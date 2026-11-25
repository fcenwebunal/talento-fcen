"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, CircleDashed, Loader2, LogIn, PencilLine, Send, Undo2 } from "lucide-react";
import { VERIFIED_LABEL } from "@/lib/labels";
import { APPLICATION_STATUS_CHIP, APPLICATION_STATUS_LABEL, type Readiness, type ReadinessItem } from "@/lib/calls";
import { applyToCall, withdrawApplication, type ApplyState } from "../actions";

type Viewer = "anon" | "user" | "student" | "company" | "staff";

function Item({ item, required }: { item: ReadinessItem; required: boolean }) {
  const Icon = item.ok ? CircleCheck : required ? CircleAlert : CircleDashed;
  const tone = item.ok ? "text-verde-tinta" : required ? "text-naranja" : "text-suave";
  return (
    <li className="flex items-start gap-2 text-sm">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
      <span className="flex-1">
        <span className={item.ok ? "text-azul-oscuro" : "font-black text-azul-oscuro"}>{item.label}</span>
        {item.value !== undefined && (
          <span className="block text-xs text-suave">
            Tienes {item.value === null ? "sin registrar" : String(item.value).replace(".", ",")}
            {item.key === "avance" && item.value !== null ? " %" : ""}
            {item.verified ? ` (${VERIFIED_LABEL[item.verified] ?? item.verified})` : ""}
          </span>
        )}
      </span>
      {!item.ok && (
        <Link href={`/estudiante/perfil?seccion=${item.section}`} className="shrink-0 text-xs font-black text-azul hover:underline">
          Completar
        </Link>
      )}
    </li>
  );
}

export function ApplyPanel({ callId, companyName, viewer, readiness }: { callId: string; companyName: string; viewer: Viewer; readiness: Readiness }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyToCall, null);

  if (!readiness.open && !readiness.application) {
    return (
      <div className="card">
        <p className="display text-lg text-azul-oscuro">Convocatoria cerrada</p>
        <p className="mt-1 text-sm text-suave">La fecha límite ya pasó y no recibe más postulaciones.</p>
      </div>
    );
  }

  if (viewer === "anon") {
    return (
      <div className="card space-y-3">
        <p className="display text-lg text-azul-oscuro">¿Te interesa?</p>
        <p className="text-sm text-suave">Ingresa con tu cuenta @unal.edu.co para postularte con la hoja de vida de tu perfil.</p>
        <Link href="/ingresar?como=estudiante" className="btn btn-accent w-full">
          <LogIn /> Ingresar para postularme
        </Link>
      </div>
    );
  }

  if (viewer === "user") {
    return (
      <div className="card space-y-2">
        <p className="display text-lg text-azul-oscuro">Tu cuenta aún no es de estudiante</p>
        <p className="text-sm text-suave">
          Solo las cuentas con rol de estudiante pueden postularse. La Facultad asigna ese rol a los estudiantes que cumplen el avance para la práctica; si crees que es tu caso,
          escríbele a la coordinación de prácticas.
        </p>
      </div>
    );
  }

  if (viewer !== "student") {
    return (
      <div className="card">
        <p className="text-sm text-suave">Las postulaciones las hacen los estudiantes desde su cuenta.</p>
      </div>
    );
  }

  const app = readiness.application;
  if (app && app.status !== "retirada") {
    const canWithdraw = ["recibida", "en_revision", "enviada"].includes(app.status);
    return (
      <div className="card space-y-3">
        <p className="display text-lg text-azul-oscuro">Ya te postulaste</p>
        <span className={`chip ${APPLICATION_STATUS_CHIP[app.status]}`}>{APPLICATION_STATUS_LABEL[app.status]}</span>
        <p className="text-sm text-suave">
          Sigue el estado en{" "}
          <Link href="/estudiante/postulaciones" className="font-black text-azul hover:underline">
            Mis postulaciones
          </Link>
          .
        </p>
        {canWithdraw && (
          <form action={withdrawApplication}>
            <input type="hidden" name="call_id" value={callId} />
            <button className="btn btn-ghost btn-sm">
              <Undo2 /> Retirar mi postulación
            </button>
          </form>
        )}
      </div>
    );
  }

  const profile = readiness.profile ?? [];
  const requirements = readiness.requirements ?? [];
  const recommended = readiness.recommended ?? [];
  const missingRecommended = recommended.filter((r) => !r.ok);

  return (
    <div className="card space-y-5">
      <div>
        <p className="display text-lg text-azul-oscuro">Postúlate</p>
        <p className="text-sm text-suave">Te postulas con la hoja de vida de tu perfil en Talento FCEN.</p>
      </div>

      <section>
        <h3 className="text-xs font-black uppercase tracking-widest text-suave">Lo obligatorio de tu hoja de vida</h3>
        <ul className="mt-2 space-y-1.5">
          {profile.map((i) => (
            <Item key={i.key} item={i} required />
          ))}
        </ul>
      </section>

      {requirements.length > 0 && (
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-suave">Requisitos académicos</h3>
          {!readiness.enforced && <p className="mt-1 text-xs text-suave">Esta convocatoria no los exige para postularse, pero la empresa los tendrá en cuenta.</p>}
          <ul className="mt-2 space-y-1.5">
            {requirements.map((i) => (
              <Item key={i.key} item={i} required={!!readiness.enforced} />
            ))}
          </ul>
        </section>
      )}

      {missingRecommended.length > 0 && (
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-suave">Recomendado para destacar</h3>
          <ul className="mt-2 space-y-1.5">
            {missingRecommended.map((i) => (
              <Item key={i.key} item={i} required={false} />
            ))}
          </ul>
        </section>
      )}

      {state?.ok ? (
        <p role="status" className="flex gap-2 rounded-lg bg-verde/10 p-3 text-sm text-azul-oscuro">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-verde-tinta" aria-hidden="true" /> {state.message}
        </p>
      ) : readiness.can_apply ? (
        <form action={action} className="space-y-3 border-t border-borde pt-4">
          <input type="hidden" name="call_id" value={callId} />
          <label className="field">
            <span>Mensaje para la empresa (opcional)</span>
            <textarea name="message" maxLength={1500} className="input min-h-24" placeholder="Por qué te interesa esta práctica y qué puedes aportar." />
          </label>
          <label className="flex items-start gap-2 text-sm text-suave">
            <input type="checkbox" name="consent" required className="mt-1" />
            <span>
              Autorizo a la Facultad y a {companyName} a ver mi hoja de vida completa y mis datos de contacto para esta convocatoria, según la{" "}
              <Link href="/datos-personales" className="font-black text-azul hover:underline">
                política de tratamiento de datos
              </Link>
              .
            </span>
          </label>
          {state && !state.ok && (
            <p role="alert" className="text-sm text-naranja">
              {state.message}
            </p>
          )}
          <button disabled={pending} className="btn btn-accent w-full">
            {pending ? <Loader2 className="animate-spin" /> : <Send />} Postularme
          </button>
        </form>
      ) : (
        <div className="space-y-3 border-t border-borde pt-4">
          <p className="text-sm text-naranja">
            {!readiness.profile_ok ? "Completa lo que está marcado para poder postularte." : "No cumples los requisitos académicos que exige esta convocatoria."}
          </p>
          {!readiness.profile_ok && (
            <Link href={`/estudiante/perfil?seccion=${profile.find((i) => !i.ok)?.section ?? "personales"}`} className="btn btn-primary w-full">
              <PencilLine /> Completar mi perfil
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
