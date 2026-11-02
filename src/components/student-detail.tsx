import {
  Award, BookOpen, CalendarDays, CheckCircle2, Clock, Code2, Compass, ExternalLink, Eye, Globe,
  GraduationCap, HeartHandshake, Languages, Lock, Mail, MapPin, Network, Phone, Plane, Sparkles, Target, Timer, Trophy,
} from "lucide-react";
import type { ExperienceKind, StudentDetail } from "@/lib/types";
import {
  AVAILABILITY_LABEL, DEDICATION_LABEL, EXPERIENCE_KIND, LEVEL_LABEL, MODALITY_LABEL, OUTPUT_KIND, SKILL_LEVEL, VERIFIED_LABEL,
  formatDate, formatMonth, freshness,
} from "@/lib/labels";
import { Avatar } from "./ui/avatar";
import { HelpTip } from "./ui/help-tip";
import { SkillIcon } from "./ui/skill-icon";
import { PrintButton } from "./cv/print-button";

export function LevelDots({ level }: { level: number }) {
  return (
    <span className="level-dots" title={SKILL_LEVEL[level]} aria-label={SKILL_LEVEL[level]}>
      {[1, 2, 3].map((l) => (
        <i key={l} className={l <= level ? "on" : ""} />
      ))}
    </span>
  );
}

const KIND_TONE: Record<ExperienceKind, string> = {
  practica: "chip-verde",
  monitoria: "chip-azul",
  investigacion: "chip-azul",
  laboral: "",
  voluntariado: "chip-amarillo",
  extension: "chip-naranja",
  emprendimiento: "chip-naranja",
};

function duration(start: string | null, end: string | null) {
  if (!start) return "";
  const months = Math.max(1, Math.round((new Date(end ?? Date.now()).getTime() - new Date(start).getTime()) / (30.44 * 86_400_000)));
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (!years) return `${months} ${months === 1 ? "mes" : "meses"}`;
  return `${years} ${years === 1 ? "año" : "años"}${rest ? ` y ${rest} ${rest === 1 ? "mes" : "meses"}` : ""}`;
}

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2", "Nativo"];

const decimal = (n: number) => n.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// The CV every viewer sees, already filtered by get_student_detail (and by the preview for the student).
export function StudentDetailView({
  detail,
  hideContact = false,
  actions,
  photoUrl,
  viewer,
}: {
  detail: StudentDetail;
  hideContact?: boolean;
  actions?: React.ReactNode;
  photoUrl?: string | null;
  viewer?: string;
}) {
  const contact = !hideContact && detail.contact_visible ? detail.contact : null;
  const fresh = freshness(detail.last_confirmed_at);
  const skillsByDomain = detail.skills.reduce<Record<string, StudentDetail["skills"]>>((acc, s) => {
    (acc[s.domain] ??= []).push(s);
    return acc;
  }, {});
  const foreign = detail.languages.filter((l) => !/^espa/i.test(l.language));
  const mainLanguage = [...foreign].sort((a, b) => CEFR.indexOf(b.level) - CEFR.indexOf(a.level))[0];
  const status = detail.academic_status === "egresado" ? "Egresado reciente" : "Estudiante";
  const fileName = `Hoja de vida ${contact?.full_name ?? detail.program ?? ""} - Talento FCEN`.trim();

  const stats = [
    detail.progress_pct !== null && {
      label: "Avance del plan",
      value: `${decimal(detail.progress_pct)} %`,
      note: VERIFIED_LABEL[detail.progress_verified],
      verified: detail.progress_verified !== "autodeclarado",
      bar: detail.progress_pct,
    },
    detail.papa !== null && { label: "PAPA", value: decimal(detail.papa), suffix: "/ 5,0", note: "registrado por la Facultad", verified: true },
    detail.graduation_date && {
      label: detail.academic_status === "egresado" ? "Grado" : "Grado estimado",
      value: formatMonth(detail.graduation_date),
    },
    (detail.practice_period || detail.available_from) && {
      label: "Práctica",
      value: detail.practice_period ?? formatMonth(detail.available_from),
      note: detail.available_from ? `desde el ${formatDate(detail.available_from)}` : undefined,
    },
    mainLanguage && {
      label: "Idiomas",
      value: `${mainLanguage.language} ${mainLanguage.level}`,
      note: foreign.length > 1 ? `y ${foreign.length - 1} más` : mainLanguage.certificate ?? undefined,
    },
  ].filter(Boolean) as { label: string; value: string; suffix?: string; note?: string; verified?: boolean; bar?: number }[];

  const contactSection = (
    <Section title="Contacto" icon={contact ? Mail : Lock}>
      {contact ? (
        <ul className="space-y-1.5 text-sm">
          {contact.email && (
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-azul-medio" aria-hidden="true" />
              <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}`} target="_blank" rel="noopener" className="truncate text-azul-medio hover:underline">
                {contact.email}
              </a>
            </li>
          )}
          {contact.phone && (
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-azul-medio" aria-hidden="true" /> {contact.phone}
            </li>
          )}
          {contact.linkedin_url && <ExtLink href={contact.linkedin_url} label="LinkedIn" icon={Network} />}
          {contact.github_url && <ExtLink href={contact.github_url} label="GitHub" icon={Code2} />}
          {contact.portfolio_url && <ExtLink href={contact.portfolio_url} label="Portafolio" icon={Globe} />}
        </ul>
      ) : (
        <p className="text-xs leading-relaxed text-suave">
          Nombre, foto, contacto, enlaces y evidencias: los ven las empresas autorizadas por la Facultad cuando el estudiante lo acepta.
        </p>
      )}
    </Section>
  );

  return (
    <article className="cv page-in">
      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        {viewer && (
          <span className="chip chip-azul">
            <Eye /> Así la ve: {viewer}
          </span>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {actions}
          <PrintButton fileName={fileName} />
        </div>
      </div>

      <div className="cv-sheet @container">
        <header className="cv-band">
          <div className="relative grid items-center gap-5 @2xl:grid-cols-[auto_1fr_auto]">
            <div className="cv-photo">
              <Avatar name={contact?.full_name ?? null} seed={detail.id} src={contact ? photoUrl : null} size={104} />
              {!contact && (
                <span className="cv-photo-lock" title="Foto y nombre visibles con autorización">
                  <Lock aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="cv-kicker">
                {detail.program_level ? LEVEL_LABEL[detail.program_level] : "Programa"} · {status}
              </p>
              <h1 className="cv-name">{contact?.full_name ?? "Perfil anónimo"}</h1>
              {detail.headline && <p className="cv-headline">{detail.headline}</p>}
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-white/80">
                <GraduationCap className="h-4 w-4 text-verde" aria-hidden="true" />
                <strong className="text-white">{detail.program}</strong>
                {detail.emphasis && <span>· énfasis en {detail.emphasis}</span>}
              </p>
            </div>
            <div className="cv-brand hidden @3xl:flex" aria-hidden="true">
              <span className="cv-brand-mark">FCEN</span>
              <span className="cv-brand-name">
                <span>Facultad de Ciencias</span>
                <span>Exactas &amp; Naturales</span>
                <span>UNAL · Sede Manizales</span>
              </span>
            </div>
          </div>
          <div className="relative mt-4 flex flex-wrap gap-1.5">
            <span className="chip chip-dark">
              <span className={`status-dot ${detail.availability === "disponible" ? "live text-verde" : "text-white/60"}`} />
              {AVAILABILITY_LABEL[detail.availability]} · {fresh.text.toLowerCase()}
            </span>
            {detail.city && (
              <span className="chip chip-dark">
                <MapPin /> {detail.city}
              </span>
            )}
            {detail.modalities.length > 0 && (
              <span className="chip chip-dark">
                <Compass /> {detail.modalities.map((m) => MODALITY_LABEL[m]).join(", ")}
              </span>
            )}
            {detail.dedication && (
              <span className="chip chip-dark">
                <Clock /> {DEDICATION_LABEL[detail.dedication]}
              </span>
            )}
          </div>
        </header>

        {stats.length > 0 && (
          <dl className="cv-stats" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 9.5rem), 1fr))` }}>
            {stats.map((s) => (
              <div key={s.label} className="cv-stat">
                <dt>{s.label}</dt>
                <dd className="cv-stat-value">
                  {s.value}
                  {s.suffix && <small> {s.suffix}</small>}
                </dd>
                {s.bar !== undefined && (
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-superficie-2">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--azul-medio),var(--verde))]" style={{ width: `${s.bar}%` }} />
                  </div>
                )}
                {s.note && (
                  <dd className={`mt-1 flex items-center gap-1 text-[0.6875rem] ${s.verified ? "text-verde-tinta" : "text-suave"}`}>
                    {s.verified && <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />}
                    {s.note}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        )}

        <div className="cv-body grid @2xl:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="cv-main space-y-6">
            {/* On narrow screens contact comes right after the key figures; wide layouts keep it in the side column */}
            <div className="@2xl:hidden">{contactSection}</div>
            {(detail.about || detail.motivation) && (
              <Section title="Perfil">
                {detail.about && <p className="whitespace-pre-line leading-relaxed">{detail.about}</p>}
                {detail.motivation && (
                  <blockquote className="cv-quote">
                    <span className="text-[0.6875rem] font-black uppercase tracking-widest text-verde-tinta">Qué busca en la práctica</span>
                    <p className="whitespace-pre-line">{detail.motivation}</p>
                  </blockquote>
                )}
              </Section>
            )}

            {detail.highlights.length > 0 && (
              <Section title="Logros destacados">
                <ol className="space-y-2">
                  {detail.highlights.map((h, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="cv-number">{i + 1}</span>
                      <span className="leading-snug">{h}</span>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {detail.experiences.length > 0 && (
              <Section title="Experiencia">
                <ol className="cv-timeline">
                  {detail.experiences.map((e, i) => (
                    <li key={i} className={`cv-timeline-item kind-${e.kind}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="font-black leading-snug text-azul-oscuro">
                          {e.role ?? EXPERIENCE_KIND[e.kind]}
                          <span className="font-normal text-azul"> · {e.organization}</span>
                        </p>
                        <p className="shrink-0 text-xs text-suave">
                          {formatMonth(e.start_date)} {e.start_date ? `a ${e.end_date ? formatMonth(e.end_date) : "la fecha"}` : ""}
                          {e.start_date && <span className="text-suave/80"> · {duration(e.start_date, e.end_date)}</span>}
                        </p>
                      </div>
                      <span className={`chip ${KIND_TONE[e.kind]} mt-1 py-0 text-[0.6875rem]`}>{EXPERIENCE_KIND[e.kind]}</span>
                      {e.description && <p className="mt-1.5 whitespace-pre-line text-sm text-suave">{e.description}</p>}
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {detail.projects.length > 0 && (
              <Section title="Proyectos">
                <div className="grid gap-3 @xl:grid-cols-2">
                  {detail.projects.map((p, i) => (
                    <div key={i} className="cv-card">
                      <p className="flex items-start justify-between gap-2">
                        <strong className="leading-snug text-azul-oscuro">{p.title}</strong>
                        {p.year && <span className="shrink-0 text-xs font-black text-suave">{p.year}</span>}
                      </p>
                      {p.role && <p className="mt-0.5 text-xs font-black text-azul-medio">{p.role}</p>}
                      {p.description && <p className="mt-1.5 text-sm text-suave">{p.description}</p>}
                      {(p.tools || p.url) && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {p.tools
                            ?.split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                            .map((t) => (
                              <span key={t} className="chip py-0 text-[0.6875rem] [--chip-bg:#fff]">
                                {t}
                              </span>
                            ))}
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener" className="ml-auto inline-flex items-center gap-1 text-xs font-black text-azul-medio hover:underline">
                              Ver <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Formación">
              <div className="cv-degree">
                <span className="icon-tile h-9 w-9 shrink-0">
                  <GraduationCap className="!h-4 !w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-black leading-snug text-azul-oscuro">{detail.program}</p>
                  <p className="text-xs text-suave">
                    Universidad Nacional de Colombia, Sede Manizales · {detail.program_level ? LEVEL_LABEL[detail.program_level] : ""} · {status}
                    {detail.graduation_date ? ` · ${detail.academic_status === "egresado" ? "grado" : "grado estimado"} ${formatMonth(detail.graduation_date)}` : ""}
                  </p>
                </div>
              </div>
              {detail.subjects.length > 0 && (
                <>
                  <SubTitle icon={BookOpen}>Asignaturas destacadas</SubTitle>
                  <ul className="grid gap-x-4 gap-y-1.5 @xl:grid-cols-2">
                    {detail.subjects.map((s, i) => (
                      <li key={i} className="text-sm leading-snug">
                        <strong className="text-azul-oscuro">{s.name}</strong>
                        {s.reason && <span className="text-suave">: {s.reason}</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {detail.courses.length > 0 && (
                <>
                  <SubTitle icon={Award}>Cursos y certificaciones</SubTitle>
                  <ul className="space-y-1.5">
                    {detail.courses.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-verde-tinta" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <strong className="text-azul-oscuro">{c.name}</strong>
                          <span className="text-suave">
                            {c.institution ? ` · ${c.institution}` : ""}
                            {c.year ? ` · ${c.year}` : ""}
                            {c.hours ? ` · ${c.hours} h` : ""}
                          </span>
                        </span>
                        {c.url && (
                          <a href={c.url} target="_blank" rel="noopener" className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-azul-medio hover:underline">
                            Verificar <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {detail.honors && (
                <div className="cv-honors">
                  <Trophy className="h-4 w-4 shrink-0 text-amarillo-tinta" aria-hidden="true" />
                  <p className="whitespace-pre-line">{detail.honors}</p>
                </div>
              )}
            </Section>

            {detail.outputs.length > 0 && (
              <Section title="Publicaciones y eventos">
                <ul className="space-y-2">
                  {detail.outputs.map((o, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-snug">
                      <span className="cv-output-kind">{OUTPUT_KIND[o.kind]}</span>
                      <span className="min-w-0 flex-1">
                        {o.title ? (
                          <strong className="text-azul-oscuro">{o.title}</strong>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-suave">
                            <Lock className="h-3 w-3" aria-hidden="true" /> Título visible con autorización
                          </span>
                        )}
                        <span className="block text-xs text-suave">
                          {[o.venue, o.year].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {o.url && (
                        <a href={o.url} target="_blank" rel="noopener" className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-azul-medio hover:underline">
                          Ver <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          <aside className="cv-side space-y-6">
            <div className="hidden @2xl:block">{contactSection}</div>

            {detail.skills.length > 0 && (
              <Section
                title="Competencias técnicas"
                help="Básico: lo usó en clase. Intermedio: en un proyecto real. Avanzado: puede enseñarlo o resolver problemas complejos."
              >
                <p className="mb-2 flex flex-wrap gap-x-2.5 text-[0.625rem] text-suave">
                  {[1, 2, 3].map((l) => (
                    <span key={l} className="inline-flex items-center gap-1">
                      <LevelDots level={l} /> {SKILL_LEVEL[l]}
                    </span>
                  ))}
                </p>
                <div className="space-y-3">
                  {Object.entries(skillsByDomain).map(([domain, list]) => (
                    <div key={domain}>
                      <p className="text-[0.625rem] font-black uppercase tracking-widest text-suave">{domain}</p>
                      <ul className="mt-1 space-y-0.5">
                        {list.map((s) => (
                          <li key={s.name} className="cv-skill" title={s.pending ? "Propuesta por el estudiante, en revisión por la Facultad" : undefined}>
                            <SkillIcon path={s.icon} />
                            <span className={`min-w-0 flex-1 truncate ${s.pending ? "italic" : ""}`}>
                              {s.name}
                              {s.pending && <span className="text-suave"> (en revisión)</span>}
                            </span>
                            {s.evidence_url && (
                              <a href={s.evidence_url} target="_blank" rel="noopener" className="text-azul-medio" title="Ver evidencia" aria-label={`Evidencia de ${s.name}`}>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <LevelDots level={s.level} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {detail.languages.length > 0 && (
              <Section title="Idiomas" icon={Languages}>
                <ul className="space-y-1.5 text-sm">
                  {detail.languages.map((l, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="min-w-0">
                        {l.language}
                        {l.certificate && <span className="block truncate text-[0.6875rem] text-suave">{l.certificate}</span>}
                      </span>
                      <span className="chip chip-azul py-0 text-xs font-black">{l.level}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {detail.soft_skills.length > 0 && (
              <Section title="Transversales" icon={HeartHandshake}>
                <div className="flex flex-wrap gap-1">
                  {detail.soft_skills.map((s) => (
                    <span key={s} className="chip py-0 text-xs [--chip-bg:#fff]">
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Disponibilidad" icon={CalendarDays}>
              <dl className="space-y-1 text-xs">
                {detail.practice_period && <Row icon={Target} k="Periodo" v={detail.practice_period} />}
                {detail.available_from && <Row icon={CalendarDays} k="Desde" v={formatDate(detail.available_from)} />}
                {detail.available_until && <Row icon={Clock} k="Hasta" v={formatDate(detail.available_until)} />}
                {detail.duration_months && <Row icon={Timer} k="Duración" v={`${detail.duration_months} meses`} />}
                {detail.practice_cities && <Row icon={MapPin} k="Puede en" v={detail.practice_cities} />}
                {detail.can_relocate !== null && <Row icon={Plane} k="Se traslada" v={detail.can_relocate ? "Sí" : "No"} />}
              </dl>
            </Section>

            {(detail.areas.length > 0 || detail.target_companies) && (
              <Section title="Intereses" icon={Compass}>
                {detail.areas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {detail.areas.map((a) => (
                      <span key={a} className="chip py-0 text-xs [--chip-bg:#fff]">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {detail.target_companies && (
                  <p className="mt-2 text-xs text-suave">
                    <strong className="text-azul-oscuro">Sectores u organizaciones: </strong>
                    {detail.target_companies}
                  </p>
                )}
              </Section>
            )}
          </aside>
        </div>

        <footer className="cv-foot">
          <span>
            <strong>Talento FCEN</strong> · Facultad de Ciencias Exactas y Naturales · Universidad Nacional de Colombia, Sede Manizales
          </span>
          <span>
            {detail.updated_at && <>Actualizada el {formatDate(detail.updated_at)} · </>}
            Uso exclusivo para procesos de práctica (Ley 1581 de 2012)
          </span>
        </footer>
      </div>
    </article>
  );
}

function Section({ title, icon: Icon, help, children }: { title: string; icon?: typeof Sparkles; help?: string; children: React.ReactNode }) {
  return (
    <section className="cv-section">
      <h2 className="cv-h">
        {Icon && <Icon className="h-3.5 w-3.5 text-azul-medio" aria-hidden="true" />}
        <span>{title}</span>
        {help && <HelpTip>{help}</HelpTip>}
      </h2>
      {children}
    </section>
  );
}

function SubTitle({ icon: Icon, children }: { icon: typeof Sparkles; children: React.ReactNode }) {
  return (
    <p className="mb-1.5 mt-4 flex items-center gap-1.5 text-xs font-black text-azul-oscuro">
      <Icon className="h-3.5 w-3.5 text-azul-medio" aria-hidden="true" /> {children}
    </p>
  );
}

function Row({ icon: Icon, k, v }: { icon: typeof Sparkles; k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-suave">
        <Icon className="h-3 w-3" aria-hidden="true" /> {k}
      </dt>
      <dd className="text-right font-black text-azul-oscuro">{v}</dd>
    </div>
  );
}

function ExtLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Sparkles }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-azul-medio" aria-hidden="true" />
      <a href={href} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-azul-medio hover:underline">
        {label} <ExternalLink className="h-3 w-3" />
      </a>
    </li>
  );
}

