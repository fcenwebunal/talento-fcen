import type { StudentDetail } from "@/lib/types";
import {
  AVAILABILITY_LABEL,
  DEDICATION_LABEL,
  LEVEL_LABEL,
  MODALITY_LABEL,
  SKILL_LEVEL,
  VERIFIED_LABEL,
  formatDate,
  freshness,
} from "@/lib/labels";

export function StudentDetailView({
  detail,
  hideContact = false,
  actions,
}: {
  detail: StudentDetail;
  hideContact?: boolean;
  actions?: React.ReactNode;
}) {
  const contact = !hideContact && detail.contact_visible ? detail.contact : null;
  const fresh = freshness(detail.last_confirmed_at);
  const skillsByDomain = detail.skills.reduce<Record<string, StudentDetail["skills"]>>((acc, s) => {
    (acc[s.domain] ??= []).push(s);
    return acc;
  }, {});

  return (
    <article className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <header className="card">
          <p className="text-sm text-suave">
            {detail.program_level ? LEVEL_LABEL[detail.program_level] : ""} · {detail.academic_status === "egresado" ? "Egresado reciente" : "Estudiante"}
          </p>
          <h2 className="display mt-1 text-2xl text-azul-oscuro">{contact?.full_name ?? "Perfil anónimo"}</h2>
          <p className="font-bold text-azul">{detail.program}</p>
          {detail.headline && <p className="mt-3 text-lg">{detail.headline}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`chip ${fresh.tone === "good" ? "chip-verde" : fresh.tone === "warn" ? "chip-amarillo" : ""}`}>
              {AVAILABILITY_LABEL[detail.availability]} · {fresh.text}
            </span>
            {detail.progress_pct !== null && (
              <span className="chip chip-azul">
                Avance {detail.progress_pct}% ({VERIFIED_LABEL[detail.progress_verified]})
              </span>
            )}
          </div>
          {actions && <div className="mt-4 flex flex-wrap gap-3">{actions}</div>}
        </header>

        {detail.about && (
          <Section title="Perfil profesional">
            <p className="whitespace-pre-line">{detail.about}</p>
          </Section>
        )}

        {detail.skills.length > 0 && (
          <Section title="Competencias técnicas">
            <div className="space-y-3">
              {Object.entries(skillsByDomain).map(([domain, list]) => (
                <div key={domain}>
                  <p className="text-xs font-bold uppercase tracking-wide text-suave">{domain}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {list.map((s) => (
                      <span key={s.name} className={`chip ${s.level === 3 ? "chip-verde" : s.level === 2 ? "chip-azul" : ""}`}>
                        {s.name} · {SKILL_LEVEL[s.level]}
                        {s.evidence_url && (
                          <a href={s.evidence_url} target="_blank" rel="noopener" className="underline" title="Ver evidencia">
                            ↗
                          </a>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {detail.soft_skills.length > 0 && (
          <Section title="Competencias transversales">
            <div className="flex flex-wrap gap-1.5">
              {detail.soft_skills.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {detail.projects.length > 0 && (
          <Section title="Proyectos">
            <ul className="space-y-3">
              {detail.projects.map((p, i) => (
                <li key={i}>
                  <p className="font-bold">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener" className="text-azul-medio underline underline-offset-2">
                        {p.title}
                      </a>
                    ) : (
                      p.title
                    )}
                    {p.year && <span className="font-normal text-suave"> · {p.year}</span>}
                  </p>
                  {p.description && <p className="text-sm text-suave">{p.description}</p>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {detail.experiences.length > 0 && (
          <Section title="Experiencia">
            <ul className="space-y-3">
              {detail.experiences.map((e, i) => (
                <li key={i}>
                  <p className="font-bold">
                    {e.role ? `${e.role}, ` : ""}
                    {e.organization}
                  </p>
                  <p className="text-xs text-suave">
                    {formatDate(e.start_date)} {e.end_date ? `a ${formatDate(e.end_date)}` : ""}
                  </p>
                  {e.description && <p className="text-sm text-suave">{e.description}</p>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {(detail.subjects.length > 0 || detail.courses.length > 0 || detail.honors || detail.emphasis) && (
          <Section title="Formación">
            {detail.emphasis && <p className="text-sm"><strong>Énfasis:</strong> {detail.emphasis}</p>}
            {detail.subjects.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {detail.subjects.map((s, i) => (
                  <li key={i}>
                    <strong>{s.name}</strong>
                    {s.reason ? `: ${s.reason}` : ""}
                  </li>
                ))}
              </ul>
            )}
            {detail.courses.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {detail.courses.map((c, i) => (
                  <li key={i}>
                    {c.name}
                    {c.institution ? `, ${c.institution}` : ""}
                    {c.year ? ` (${c.year})` : ""}
                    {c.hours ? ` · ${c.hours} h` : ""}
                  </li>
                ))}
              </ul>
            )}
            {detail.honors && <p className="mt-3 text-sm whitespace-pre-line">{detail.honors}</p>}
          </Section>
        )}
      </div>

      <aside className="space-y-4">
        <div className="card">
          <h3 className="font-bold text-azul-oscuro">Contacto</h3>
          {contact ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {contact.email && (
                <li>
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}`}
                    target="_blank"
                    rel="noopener"
                    className="text-azul-medio underline underline-offset-2"
                  >
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.phone && <li>{contact.phone}</li>}
              {contact.linkedin_url && <ExtLink href={contact.linkedin_url} label="LinkedIn" />}
              {contact.github_url && <ExtLink href={contact.github_url} label="GitHub" />}
              {contact.portfolio_url && <ExtLink href={contact.portfolio_url} label="Portafolio" />}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-suave">
              Los datos de contacto solo los ven las empresas autorizadas por la Facultad, cuando el estudiante lo aceptó.
            </p>
          )}
        </div>
        <div className="card text-sm">
          <h3 className="font-bold text-azul-oscuro">Disponibilidad</h3>
          <dl className="mt-2 space-y-1.5">
            {detail.practice_period && <Row k="Periodo" v={detail.practice_period} />}
            {detail.available_from && <Row k="Desde" v={formatDate(detail.available_from)} />}
            {detail.available_until && <Row k="Hasta" v={formatDate(detail.available_until)} />}
            {detail.duration_months && <Row k="Duración" v={`${detail.duration_months} meses`} />}
            {detail.dedication && <Row k="Dedicación" v={DEDICATION_LABEL[detail.dedication]} />}
            {detail.modalities.length > 0 && <Row k="Modalidad" v={detail.modalities.map((m) => MODALITY_LABEL[m]).join(", ")} />}
            {detail.city && <Row k="Ciudad" v={detail.city} />}
            {detail.practice_cities && <Row k="Puede en" v={detail.practice_cities} />}
            {detail.can_relocate !== null && <Row k="Se traslada" v={detail.can_relocate ? "Sí" : "No"} />}
          </dl>
        </div>
        {detail.languages.length > 0 && (
          <div className="card text-sm">
            <h3 className="font-bold text-azul-oscuro">Idiomas</h3>
            <ul className="mt-2 space-y-1">
              {detail.languages.map((l, i) => (
                <li key={i}>
                  {l.language} · <strong>{l.level}</strong>
                  {l.certificate ? ` (${l.certificate})` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        {detail.areas.length > 0 && (
          <div className="card text-sm">
            <h3 className="font-bold text-azul-oscuro">Áreas de interés</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {detail.areas.map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
        {detail.motivation && (
          <div className="card text-sm">
            <h3 className="font-bold text-azul-oscuro">Qué espera de la práctica</h3>
            <p className="mt-2 whitespace-pre-line text-suave">{detail.motivation}</p>
          </div>
        )}
      </aside>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h3 className="mb-3 font-bold text-azul-oscuro">{title}</h3>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-suave">{k}</dt>
      <dd className="text-right font-bold">{v}</dd>
    </div>
  );
}

function ExtLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noopener" className="text-azul-medio underline underline-offset-2">
        {label}
      </a>
    </li>
  );
}
