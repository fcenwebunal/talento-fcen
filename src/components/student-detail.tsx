import {
  BookOpen, Briefcase, CalendarDays, CheckCircle2, Clock, Compass, ExternalLink, FolderGit2, Code2, Globe,
  GraduationCap, HeartHandshake, Languages, Network, Lock, Mail, MapPin, MessageSquareQuote, Phone, Plane,
  Sparkles, Target, Timer,
} from "lucide-react";
import type { StudentDetail } from "@/lib/types";
import {
  AVAILABILITY_LABEL, DEDICATION_LABEL, LEVEL_LABEL, MODALITY_LABEL, SKILL_LEVEL, VERIFIED_LABEL, formatDate, freshness,
} from "@/lib/labels";
import { Avatar } from "./ui/avatar";
import { HelpTip } from "./ui/help-tip";
import { CornerLines } from "./ui/decor";
import { PuzzleMatch } from "./ui/connect-art";

export function LevelDots({ level }: { level: number }) {
  return (
    <span className="level-dots" title={SKILL_LEVEL[level]} aria-label={SKILL_LEVEL[level]}>
      {[1, 2, 3].map((l) => (
        <i key={l} className={l <= level ? "on" : ""} />
      ))}
    </span>
  );
}

export function StudentDetailView({
  detail,
  hideContact = false,
  actions,
  photoUrl,
}: {
  detail: StudentDetail;
  hideContact?: boolean;
  actions?: React.ReactNode;
  photoUrl?: string | null;
}) {
  const contact = !hideContact && detail.contact_visible ? detail.contact : null;
  const fresh = freshness(detail.last_confirmed_at);
  const skillsByDomain = detail.skills.reduce<Record<string, StudentDetail["skills"]>>((acc, s) => {
    (acc[s.domain] ??= []).push(s);
    return acc;
  }, {});

  return (
    <article className="page-in grid gap-6 lg:grid-cols-[1fr_21rem]">
      <div className="min-w-0 space-y-5">
        <header className="card overflow-hidden p-0">
          <div className="relative h-24 overflow-hidden bg-celeste">
            <div className="bg-links absolute inset-0" />
            <PuzzleMatch className="absolute -bottom-2 right-4 w-32 opacity-90" />
          </div>
          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-wrap items-end gap-4">
              <div className="rounded-full border-4 border-white bg-white shadow-md">
                <Avatar name={contact?.full_name ?? detail.program} seed={detail.id} src={contact ? photoUrl : null} size={84} />
              </div>
              <div className="flex flex-wrap gap-2 pb-1">
                <span className={`chip ${fresh.tone === "good" ? "chip-verde" : fresh.tone === "warn" ? "chip-amarillo" : ""}`}>
                  <span className={`status-dot ${detail.availability === "disponible" ? "live" : ""}`} />
                  {AVAILABILITY_LABEL[detail.availability]} · {fresh.text}
                </span>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-suave">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              {detail.program_level ? LEVEL_LABEL[detail.program_level] : ""} · {detail.academic_status === "egresado" ? "Egresado reciente" : "Estudiante"}
            </p>
            <h2 className="display mt-1 text-3xl text-azul-oscuro">
              {contact?.full_name ?? (
                <span className="inline-flex items-center gap-2">
                  Perfil anónimo <Lock className="h-5 w-5 text-suave" aria-hidden="true" />
                </span>
              )}
            </h2>
            <p className="font-black text-azul">{detail.program}</p>
            {detail.headline && <p className="mt-3 text-lg">{detail.headline}</p>}
            {detail.progress_pct !== null && (
              <div className="mt-5 max-w-sm">
                <div className="flex items-center justify-between text-xs text-suave">
                  <span className="flex items-center gap-1">
                    Avance del plan de estudios
                    <HelpTip>Porcentaje de créditos aprobados. «{VERIFIED_LABEL[detail.progress_verified]}».</HelpTip>
                  </span>
                  <span className="font-black text-azul">{detail.progress_pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-superficie-2">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--azul-medio),var(--verde))]" style={{ width: `${detail.progress_pct}%` }} />
                </div>
                {detail.progress_verified !== "autodeclarado" && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-verde-tinta">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {VERIFIED_LABEL[detail.progress_verified]}
                  </p>
                )}
              </div>
            )}
            {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
          </div>
        </header>

        {detail.about && (
          <Section title="Perfil profesional" icon={MessageSquareQuote}>
            <p className="whitespace-pre-line leading-relaxed">{detail.about}</p>
          </Section>
        )}

        {detail.skills.length > 0 && (
          <Section
            title="Competencias técnicas"
            icon={Sparkles}
            help="Básico: lo usó en clase. Intermedio: en un proyecto real. Avanzado: puede enseñarlo o resolver problemas complejos."
          >
            <div className="space-y-4">
              {Object.entries(skillsByDomain).map(([domain, list]) => (
                <div key={domain}>
                  <p className="text-[0.6875rem] font-black uppercase tracking-widest text-suave">{domain}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {list.map((s) => (
                      <span key={s.name} className={`chip ${s.level === 3 ? "chip-verde" : s.level === 2 ? "chip-azul" : ""}`}>
                        {s.name}
                        <LevelDots level={s.level} />
                        {s.evidence_url && (
                          <a href={s.evidence_url} target="_blank" rel="noopener" title="Ver evidencia" aria-label={`Evidencia de ${s.name}`}>
                            <ExternalLink />
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
          <Section title="Competencias transversales" icon={HeartHandshake}>
            <div className="flex flex-wrap gap-1.5">
              {detail.soft_skills.map((s) => (
                <span key={s} className="chip">
                  <CheckCircle2 className="text-verde-tinta" /> {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {detail.projects.length > 0 && (
          <Section title="Proyectos" icon={FolderGit2}>
            <div className="grid gap-3 md:grid-cols-2">
              {detail.projects.map((p, i) => (
                <div key={i} className="card-flat p-4">
                  <p className="flex items-start justify-between gap-2 font-black text-azul-oscuro">
                    <span>{p.title}</span>
                    {p.year && <span className="chip shrink-0 [--chip-bg:#fff]">{p.year}</span>}
                  </p>
                  {p.description && <p className="mt-1.5 text-sm text-suave">{p.description}</p>}
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1 text-sm font-black text-azul-medio hover:underline">
                      Ver proyecto <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {detail.experiences.length > 0 && (
          <Section title="Experiencia" icon={Briefcase}>
            <ol className="relative space-y-5 border-l-2 border-borde pl-6">
              {detail.experiences.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[1.95rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-azul-medio shadow" />
                  <p className="font-black text-azul-oscuro">
                    {e.role ? `${e.role}, ` : ""}
                    {e.organization}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-suave">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDate(e.start_date)} {e.end_date ? `a ${formatDate(e.end_date)}` : "a la fecha"}
                  </p>
                  {e.description && <p className="mt-1 text-sm text-suave">{e.description}</p>}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {(detail.subjects.length > 0 || detail.courses.length > 0 || detail.honors || detail.emphasis) && (
          <Section title="Formación" icon={BookOpen}>
            {detail.emphasis && (
              <p className="text-sm">
                <strong>Énfasis:</strong> {detail.emphasis}
              </p>
            )}
            {detail.subjects.length > 0 && (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {detail.subjects.map((s, i) => (
                  <li key={i} className="rounded-lg bg-superficie p-3 text-sm">
                    <strong className="text-azul-oscuro">{s.name}</strong>
                    {s.reason && <p className="mt-0.5 text-suave">{s.reason}</p>}
                  </li>
                ))}
              </ul>
            )}
            {detail.courses.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm">
                {detail.courses.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-verde-tinta" aria-hidden="true" />
                    <span>
                      {c.name}
                      {c.institution ? `, ${c.institution}` : ""}
                      {c.year ? ` (${c.year})` : ""}
                      {c.hours ? ` · ${c.hours} h` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {detail.honors && <p className="mt-4 whitespace-pre-line rounded-lg border-l-4 border-amarillo bg-amarillo/10 p-3 text-sm">{detail.honors}</p>}
          </Section>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className={`card overflow-hidden ${contact ? "" : "bg-superficie"}`}>
          <CornerLines className="absolute -right-6 -top-6 w-24 text-azul" />
          <h3 className="flex items-center gap-2 font-black text-azul-oscuro">
            {contact ? <Mail className="h-4 w-4 text-azul-medio" /> : <Lock className="h-4 w-4 text-suave" />} Contacto
          </h3>
          {contact ? (
            <ul className="mt-3 space-y-2 text-sm">
              {contact.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-suave" aria-hidden="true" />
                  <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}`} target="_blank" rel="noopener" className="truncate text-azul-medio hover:underline">
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-suave" aria-hidden="true" /> {contact.phone}
                </li>
              )}
              {contact.linkedin_url && <ExtLink href={contact.linkedin_url} label="LinkedIn" icon={Network} />}
              {contact.github_url && <ExtLink href={contact.github_url} label="GitHub" icon={Code2} />}
              {contact.portfolio_url && <ExtLink href={contact.portfolio_url} label="Portafolio" icon={Globe} />}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-suave">Los datos de contacto solo los ven las empresas autorizadas por la Facultad, cuando el estudiante lo aceptó.</p>
          )}
        </div>

        <div className="card text-sm">
          <h3 className="flex items-center gap-2 font-black text-azul-oscuro">
            <CalendarDays className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Disponibilidad
          </h3>
          <dl className="mt-3 space-y-2">
            {detail.practice_period && <Row icon={Target} k="Periodo" v={detail.practice_period} />}
            {detail.available_from && <Row icon={CalendarDays} k="Desde" v={formatDate(detail.available_from)} />}
            {detail.available_until && <Row icon={Clock} k="Hasta" v={formatDate(detail.available_until)} />}
            {detail.duration_months && <Row icon={Timer} k="Duración" v={`${detail.duration_months} meses`} />}
            {detail.dedication && <Row icon={Clock} k="Dedicación" v={DEDICATION_LABEL[detail.dedication]} />}
            {detail.modalities.length > 0 && <Row icon={Compass} k="Modalidad" v={detail.modalities.map((m) => MODALITY_LABEL[m]).join(", ")} />}
            {detail.city && <Row icon={MapPin} k="Ciudad" v={detail.city} />}
            {detail.practice_cities && <Row icon={MapPin} k="Puede en" v={detail.practice_cities} />}
            {detail.can_relocate !== null && <Row icon={Plane} k="Se traslada" v={detail.can_relocate ? "Sí" : "No"} />}
          </dl>
        </div>

        {detail.languages.length > 0 && (
          <div className="card text-sm">
            <h3 className="flex items-center gap-2 font-black text-azul-oscuro">
              <Languages className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Idiomas
            </h3>
            <ul className="mt-3 space-y-2">
              {detail.languages.map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span>
                    {l.language}
                    {l.certificate && <span className="block text-xs text-suave">{l.certificate}</span>}
                  </span>
                  <span className="chip chip-azul font-black">{l.level}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {detail.areas.length > 0 && (
          <div className="card text-sm">
            <h3 className="flex items-center gap-2 font-black text-azul-oscuro">
              <Compass className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Áreas de interés
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {detail.areas.map((a) => (
                <span key={a} className="chip">{a}</span>
              ))}
            </div>
          </div>
        )}

        {detail.motivation && (
          <div className="card-dark text-sm">
            <h3 className="flex items-center gap-2 font-black">
              <Target className="h-4 w-4 text-verde" aria-hidden="true" /> Qué espera de la práctica
            </h3>
            <p className="mt-2 whitespace-pre-line text-white/80">{detail.motivation}</p>
          </div>
        )}
      </aside>
    </article>
  );
}

function Section({ title, icon: Icon, help, children }: { title: string; icon: typeof Sparkles; help?: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h3 className="mb-4 flex items-center gap-2.5 font-black text-azul-oscuro">
        <span className="icon-tile h-8 w-8">
          <Icon className="!h-4 !w-4" />
        </span>
        {title}
        {help && <HelpTip>{help}</HelpTip>}
      </h3>
      {children}
    </section>
  );
}

function Row({ icon: Icon, k, v }: { icon: typeof Sparkles; k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-suave">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {k}
      </dt>
      <dd className="text-right font-black">{v}</dd>
    </div>
  );
}

function ExtLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Sparkles }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-suave" aria-hidden="true" />
      <a href={href} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-azul-medio hover:underline">
        {label} <ExternalLink className="h-3 w-3" />
      </a>
    </li>
  );
}
