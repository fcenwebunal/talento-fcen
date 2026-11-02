import "server-only";
import fs from "node:fs";
import os from "node:os";
import { Circle, Document, Font, Image, Link, Page, Path, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ExperienceKind, StudentDetail } from "./types";
import {
  AVAILABILITY_LABEL, DEDICATION_LABEL, EXPERIENCE_KIND, LEVEL_LABEL, MODALITY_LABEL, OUTPUT_KIND, SKILL_LEVEL, VERIFIED_LABEL,
  formatDate, formatMonth, freshness,
} from "./labels";
import { PUBLIC_SITE } from "./config";

// Printable CV: built for paper, not copied from the screen. Light grey band with dark text, one reading column with
// compact grids, entries that never split across pages, visible URLs and no marks of the platform.

const FONT_FILES = { regular: "Ancizar_Sans-Regular.otf", black: "Ancizar_Sans_Black.otf", serif: "Ancizar_Serif-Bold_Italic.otf" };
let fonts: { sans: string; serif: string } | null = null;

// The fonts ship with outputFileTracingIncludes; the ignore comments keep the tracer from pulling in the whole project
async function fontDir() {
  const cwd = process.cwd();
  const local = [`${cwd}/public/fonts`, `${cwd}/.next/standalone/public/fonts`].find((d) =>
    fs.existsSync(/* turbopackIgnore: true */ `${d}/${FONT_FILES.regular}`)
  );
  if (local) return local;
  // Last resort when the deployment did not ship public/: copy them once from the app itself
  try {
    const tmp = `${os.tmpdir()}/cv-fonts`;
    fs.mkdirSync(/* turbopackIgnore: true */ tmp, { recursive: true });
    for (const file of Object.values(FONT_FILES)) {
      const target = `${tmp}/${file}`;
      if (fs.existsSync(/* turbopackIgnore: true */ target)) continue;
      const res = await fetch(`${PUBLIC_SITE}/fonts/${file}`);
      if (!res.ok) return null;
      fs.writeFileSync(/* turbopackIgnore: true */ target, Buffer.from(await res.arrayBuffer()));
    }
    return tmp;
  } catch {
    return null;
  }
}

async function ensureFonts() {
  if (fonts) return fonts;
  const dir = await fontDir();
  if (dir) {
    Font.register({
      family: "Ancizar",
      fonts: [
        { src: `${dir}/${FONT_FILES.regular}`, fontWeight: 400 },
        { src: `${dir}/${FONT_FILES.black}`, fontWeight: 900 },
      ],
    });
    Font.register({ family: "AncizarSerif", fonts: [{ src: `${dir}/${FONT_FILES.serif}`, fontWeight: 700, fontStyle: "italic" }] });
    fonts = { sans: "Ancizar", serif: "AncizarSerif" };
  } else {
    fonts = { sans: "Helvetica", serif: "Times-Roman" };
  }
  // Spanish words are never hyphenated with the default English rules
  Font.registerHyphenationCallback((word) => [word]);
  return fonts;
}

const C = {
  ink: "#151c27",
  text: "#262f3b",
  muted: "#4d5866",
  line: "#d3dae2",
  band: "#eef1f4",
  soft: "#f6f8fa",
  navy: "#0b2e59",
  blue: "#13477c",
  green: "#7ab317",
  greenInk: "#3f6a00",
  amberSoft: "#fbf5e6",
  amber: "#c9940f",
};

const KIND_COLOR: Record<ExperienceKind, string> = {
  practica: "#3f6a00",
  monitoria: "#13477c",
  investigacion: "#0c6896",
  voluntariado: "#8a5d00",
  extension: "#a3330a",
  emprendimiento: "#a3330a",
  laboral: "#0b2e59",
};

const LEVEL_MEANING = ["", "lo usó en clase", "lo usó en un proyecto real", "puede enseñarlo"];
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2", "Nativo"];
const decimal = (n: number) => n.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function duration(start: string | null, end: string | null) {
  if (!start) return "";
  const months = Math.max(1, Math.round((new Date(end ?? Date.now()).getTime() - new Date(start).getTime()) / (30.44 * 86_400_000)));
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (!years) return `${months} ${months === 1 ? "mes" : "meses"}`;
  return `${years} ${years === 1 ? "año" : "años"}${rest ? ` y ${rest} ${rest === 1 ? "mes" : "meses"}` : ""}`;
}

function makeStyles(f: { sans: string; serif: string }) {
  return StyleSheet.create({
    page: { paddingTop: 30, paddingBottom: 34, paddingHorizontal: 38, fontFamily: f.sans, fontSize: 9.2, lineHeight: 1.38, color: C.text },
    runningHeadBox: { position: "absolute", top: 12, left: 38, right: 38 },
    runningHead: { fontSize: 7, color: C.muted, borderBottomWidth: 0.5, borderBottomColor: C.line, paddingBottom: 3 },
    pageNumber: { position: "absolute", bottom: 14, right: 38, fontSize: 7, color: C.muted },
    band: { backgroundColor: C.band, borderTopWidth: 3, borderTopColor: C.green, borderRadius: 3, paddingVertical: 12, paddingHorizontal: 14 },
    bandRow: { flexDirection: "row", alignItems: "center" },
    photoRing: { width: 66, height: 66, borderRadius: 33, padding: 2, backgroundColor: "#ffffff", borderWidth: 0.75, borderColor: C.line, marginRight: 14 },
    photo: { width: 60, height: 60, borderRadius: 30, objectFit: "cover" },
    kicker: { fontSize: 6.8, fontWeight: 900, letterSpacing: 1.3, textTransform: "uppercase", color: C.muted },
    name: { fontSize: 20, fontWeight: 900, lineHeight: 1.1, color: C.ink, marginTop: 1 },
    headline: { fontFamily: f.serif, fontStyle: "italic", fontWeight: 700, fontSize: 10.5, color: C.text, marginTop: 2 },
    program: { fontSize: 8.6, color: C.text, marginTop: 3 },
    brand: { width: 132, alignItems: "flex-end", alignSelf: "flex-start" },
    brandMark: { fontSize: 15, fontWeight: 900, color: C.navy, lineHeight: 1 },
    brandName: { fontSize: 6.4, color: C.muted, textAlign: "right", marginTop: 2, lineHeight: 1.3 },
    facts: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, paddingTop: 7, borderTopWidth: 0.5, borderTopColor: C.line },
    fact: { fontSize: 7.8, color: C.text, marginRight: 12 },
    factLabel: { fontWeight: 900, color: C.ink },
    contact: { flexDirection: "row", flexWrap: "wrap", marginTop: 5 },
    contactItem: { fontSize: 7.8, color: C.blue, marginRight: 12, textDecoration: "none" },
    reserved: { fontSize: 7.6, color: C.muted, marginTop: 5 },
    stats: { flexDirection: "row", marginTop: 8, borderWidth: 0.75, borderColor: C.line, borderRadius: 3 },
    stat: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 0.75, borderRightColor: C.line },
    statLast: { borderRightWidth: 0 },
    statLabel: { fontSize: 6.2, fontWeight: 900, letterSpacing: 0.9, textTransform: "uppercase", color: C.muted },
    statValue: { fontFamily: f.serif, fontStyle: "italic", fontWeight: 700, fontSize: 12.5, color: C.navy, marginTop: 1 },
    statNote: { fontSize: 6.6, color: C.muted, marginTop: 1 },
    section: { marginTop: 11 },
    h: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
    hBar: { width: 10, height: 1.6, backgroundColor: C.green, marginRight: 5 },
    hText: { fontSize: 7.6, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase", color: C.navy },
    hLine: { flex: 1, height: 0.5, backgroundColor: C.line, marginLeft: 6 },
    quote: { marginTop: 6, paddingVertical: 5, paddingHorizontal: 8, borderLeftWidth: 2, borderLeftColor: C.green, backgroundColor: C.soft },
    quoteLabel: { fontSize: 6.2, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: C.greenInk },
    quoteText: { fontFamily: f.serif, fontStyle: "italic", fontWeight: 700, fontSize: 9, color: C.ink, marginTop: 1 },
    highlight: { flexDirection: "row", marginBottom: 3 },
    number: { width: 13, height: 13, borderRadius: 2.5, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", marginRight: 7, marginTop: 0.5 },
    numberText: { color: "#ffffff", fontSize: 7, fontWeight: 900, lineHeight: 1 },
    entry: { borderLeftWidth: 2, paddingLeft: 8, marginBottom: 7 },
    entryHead: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: { flex: 1, fontWeight: 900, color: C.ink, paddingRight: 8 },
    entryOrg: { fontWeight: 400, color: C.blue },
    entryDates: { fontSize: 7.6, color: C.muted },
    entryKind: { fontSize: 6.4, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 1 },
    entryText: { fontSize: 8.6, color: C.text, marginTop: 2 },
    row2: { flexDirection: "row", marginBottom: 6 },
    card: { flex: 1, borderWidth: 0.75, borderColor: C.line, borderRadius: 3, padding: 7 },
    cardGap: { width: 7 },
    cardTitle: { flex: 1, fontWeight: 900, color: C.ink, paddingRight: 6 },
    cardRole: { fontSize: 7.4, fontWeight: 900, color: C.blue, marginTop: 1 },
    small: { fontSize: 7.6, color: C.muted, marginTop: 2 },
    legend: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
    legendItem: { flexDirection: "row", alignItems: "center", marginRight: 10, fontSize: 6.8, color: C.muted },
    domain: { marginBottom: 5 },
    domainLabel: { fontSize: 6.4, fontWeight: 900, letterSpacing: 0.9, textTransform: "uppercase", color: C.muted, marginBottom: 1.5 },
    skills: { flexDirection: "row", flexWrap: "wrap" },
    skill: { width: "33.33%", flexDirection: "row", alignItems: "center", paddingRight: 10, paddingVertical: 1.2 },
    skillName: { flex: 1, fontSize: 8.4, color: C.ink, marginLeft: 5 },
    dots: { flexDirection: "row", alignItems: "center" },
    dot: { width: 4.2, height: 4.2, borderRadius: 2.1, marginRight: 1.2 },
    degree: { fontWeight: 900, color: C.ink },
    sub: { fontSize: 7.4, fontWeight: 900, color: C.navy, marginTop: 6, marginBottom: 2 },
    twoCols: { flexDirection: "row", flexWrap: "wrap" },
    half: { width: "50%", paddingRight: 10, marginBottom: 2 },
    listItem: { flexDirection: "row", marginBottom: 2 },
    bullet: { width: 3.5, height: 3.5, backgroundColor: C.green, marginTop: 4, marginRight: 6 },
    honors: { marginTop: 6, padding: 6, borderLeftWidth: 2, borderLeftColor: C.amber, backgroundColor: C.amberSoft, fontSize: 8.4 },
    output: { flexDirection: "row", marginBottom: 4 },
    outputKind: { width: 76, fontSize: 6.4, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase", color: C.blue, paddingTop: 1.5 },
    grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 11, borderTopWidth: 0.5, borderTopColor: C.line, paddingTop: 2 },
    cell: { width: "50%", paddingRight: 12, marginTop: 7 },
    cellTitle: { fontSize: 7.2, fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase", color: C.navy, marginBottom: 2 },
    kv: { flexDirection: "row", fontSize: 8.2, marginBottom: 0.8 },
    kvKey: { width: 62, color: C.muted },
    kvValue: { flex: 1, color: C.ink },
    closing: { marginTop: 16, fontSize: 7, color: C.muted, textAlign: "center" },
    link: { color: C.blue, textDecoration: "none" },
  });
}

type Styles = ReturnType<typeof makeStyles>;

function Heading({ s, children }: { s: Styles; children: string }) {
  // minPresenceAhead keeps a heading from being stranded at the bottom of a page
  return (
    <View style={s.h} minPresenceAhead={42}>
      <View style={s.hBar} />
      <Text style={s.hText}>{children}</Text>
      <View style={s.hLine} />
    </View>
  );
}

function Dots({ s, level }: { s: Styles; level: number }) {
  return (
    <View style={s.dots}>
      {[1, 2, 3].map((l) => (
        <View key={l} style={[s.dot, { backgroundColor: l <= level ? C.navy : C.line }]} />
      ))}
    </View>
  );
}

function Silhouette() {
  return (
    <Svg width={60} height={60} viewBox="0 0 60 60">
      <Circle cx={30} cy={30} r={30} fill="#dde3ea" />
      <Circle cx={30} cy={24} r={10} fill="#a3afbd" />
      <Path d="M12 52c2-10 9-15 18-15s16 5 18 15" fill="#a3afbd" />
    </Svg>
  );
}

export function CvDocument({ detail, photo, generatedAt, f }: { detail: StudentDetail; photo: Buffer | null; generatedAt: Date; f: { sans: string; serif: string } }) {
  const s = makeStyles(f);
  const contact = detail.contact_visible ? detail.contact : null;
  const name = contact?.full_name ?? "Perfil anónimo";
  const status = detail.academic_status === "egresado" ? "Egresado reciente" : "Estudiante";
  const level = detail.program_level ? LEVEL_LABEL[detail.program_level] : "Programa";
  const fresh = freshness(detail.last_confirmed_at);
  const foreign = detail.languages.filter((l) => !/^espa/i.test(l.language));
  const mainLanguage = [...foreign].sort((a, b) => CEFR.indexOf(b.level) - CEFR.indexOf(a.level))[0];
  const skillsByDomain = detail.skills.reduce<Record<string, StudentDetail["skills"]>>((acc, sk) => {
    (acc[sk.domain] ??= []).push(sk);
    return acc;
  }, {});
  const projectRows: StudentDetail["projects"][] = [];
  detail.projects.forEach((p, i) => (i % 2 ? projectRows[projectRows.length - 1].push(p) : projectRows.push([p])));

  const stats = [
    detail.progress_pct !== null && { label: "Avance del plan", value: `${decimal(detail.progress_pct)} %`, note: VERIFIED_LABEL[detail.progress_verified] },
    detail.papa !== null && { label: "PAPA", value: `${decimal(detail.papa)} / 5,0`, note: "registrado por la Facultad" },
    detail.graduation_date && { label: detail.academic_status === "egresado" ? "Grado" : "Grado estimado", value: formatMonth(detail.graduation_date) },
    (detail.practice_period || detail.available_from) && {
      label: "Práctica",
      value: detail.practice_period ?? formatMonth(detail.available_from),
      note: detail.available_from ? `desde el ${formatDate(detail.available_from)}` : undefined,
    },
    mainLanguage && { label: "Idiomas", value: `${mainLanguage.language} ${mainLanguage.level}`, note: foreign.length > 1 ? `y ${foreign.length - 1} más` : mainLanguage.certificate ?? undefined },
  ].filter(Boolean) as { label: string; value: string; note?: string }[];

  const contactLinks = contact
    ? ([
        contact.email && { label: contact.email, href: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}` },
        contact.phone && { label: contact.phone, href: null },
        contact.linkedin_url && { label: shortUrl(contact.linkedin_url), href: contact.linkedin_url },
        contact.github_url && { label: shortUrl(contact.github_url), href: contact.github_url },
        contact.portfolio_url && { label: shortUrl(contact.portfolio_url), href: contact.portfolio_url },
      ].filter(Boolean) as { label: string; href: string | null }[])
    : [];

  return (
    <Document title={`Hoja de vida · ${name}`} author={contact?.full_name ?? undefined} subject={detail.program ?? undefined} language="es-CO" creator="FCEN, UNAL Manizales" producer="FCEN, UNAL Manizales">
      <Page size="LETTER" style={s.page}>
        <View style={s.runningHeadBox} fixed render={({ pageNumber }) => (pageNumber > 1 ? <Text style={s.runningHead}>{`${name} · ${detail.program ?? ""} · hoja de vida`}</Text> : null)} />
        <Text style={s.pageNumber} fixed render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : "")} />

        <View style={s.band} wrap={false}>
          <View style={s.bandRow}>
            <View style={s.photoRing}>{photo ? <Image style={s.photo} src={{ data: photo, format: "jpg" }} /> : <Silhouette />}</View>
            <View style={{ flex: 1 }}>
              <Text style={s.kicker}>
                {level} · {status}
              </Text>
              <Text style={s.name}>{name}</Text>
              {detail.headline && <Text style={s.headline}>{detail.headline}</Text>}
              <Text style={s.program}>
                <Text style={{ fontWeight: 900, color: C.ink }}>{detail.program}</Text>
                {detail.emphasis ? ` · énfasis en ${detail.emphasis}` : ""}
              </Text>
              {contactLinks.length > 0 ? (
                <View style={s.contact}>
                  {contactLinks.map((c) =>
                    c.href ? (
                      <Link key={c.label} src={c.href} style={s.contactItem}>
                        {c.label}
                      </Link>
                    ) : (
                      <Text key={c.label} style={[s.contactItem, { color: C.ink }]}>
                        {c.label}
                      </Text>
                    )
                  )}
                </View>
              ) : (
                !contact && <Text style={s.reserved}>Nombre, foto y contacto reservados: los ve una empresa autorizada por la Facultad cuando el estudiante lo acepta.</Text>
              )}
            </View>
            <View style={s.brand}>
              <Text style={s.brandMark}>FCEN</Text>
              <Text style={s.brandName}>{"Facultad de Ciencias Exactas y Naturales\nUniversidad Nacional de Colombia\nSede Manizales"}</Text>
            </View>
          </View>
          <View style={s.facts}>
            <Text style={s.fact}>
              <Text style={s.factLabel}>{AVAILABILITY_LABEL[detail.availability]}</Text> · {fresh.text.toLowerCase()}
            </Text>
            {detail.city && <Text style={s.fact}>{detail.city}</Text>}
            {detail.modalities.length > 0 && <Text style={s.fact}>{detail.modalities.map((m) => MODALITY_LABEL[m]).join(", ")}</Text>}
            {detail.dedication && <Text style={s.fact}>{DEDICATION_LABEL[detail.dedication]}</Text>}
          </View>
        </View>

        {stats.length > 0 && (
          <View style={s.stats} wrap={false}>
            {stats.map((st, i) => (
              <View key={st.label} style={i === stats.length - 1 ? [s.stat, s.statLast] : s.stat}>
                <Text style={s.statLabel}>{st.label}</Text>
                <Text style={s.statValue}>{st.value}</Text>
                {st.note && <Text style={s.statNote}>{st.note}</Text>}
              </View>
            ))}
          </View>
        )}

        {(detail.about || detail.motivation) && (
          <View style={s.section}>
            <Heading s={s}>Perfil</Heading>
            {detail.about && (
              <Text orphans={2} widows={2}>
                {detail.about}
              </Text>
            )}
            {detail.motivation && (
              <View style={s.quote} wrap={false}>
                <Text style={s.quoteLabel}>Qué busca en la práctica</Text>
                <Text style={s.quoteText}>{detail.motivation}</Text>
              </View>
            )}
          </View>
        )}

        {detail.highlights.length > 0 && (
          <View style={s.section}>
            <Heading s={s}>Logros destacados</Heading>
            {detail.highlights.map((h, i) => (
              <View key={i} style={s.highlight} wrap={false}>
                <View style={s.number}>
                  <Text style={s.numberText}>{String(i + 1)}</Text>
                </View>
                <Text style={{ flex: 1 }}>{h}</Text>
              </View>
            ))}
          </View>
        )}

        {detail.experiences.length > 0 && (
          <View style={s.section}>
            <Heading s={s}>Experiencia</Heading>
            {detail.experiences.map((e, i) => (
              <View key={i} style={[s.entry, { borderLeftColor: KIND_COLOR[e.kind] }]} wrap={false}>
                <View style={s.entryHead}>
                  <Text style={s.entryTitle}>
                    {e.role ?? EXPERIENCE_KIND[e.kind]}
                    <Text style={s.entryOrg}> · {e.organization}</Text>
                  </Text>
                  {e.start_date && (
                    <Text style={s.entryDates}>
                      {formatMonth(e.start_date)} a {e.end_date ? formatMonth(e.end_date) : "la fecha"} · {duration(e.start_date, e.end_date)}
                    </Text>
                  )}
                </View>
                <Text style={[s.entryKind, { color: KIND_COLOR[e.kind] }]}>{EXPERIENCE_KIND[e.kind]}</Text>
                {e.description && <Text style={s.entryText}>{e.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {projectRows.length > 0 && (
          <View style={s.section}>
            <Heading s={s}>Proyectos</Heading>
            {projectRows.map((row, r) => (
              <View key={r} style={s.row2} wrap={false}>
                {row.map((p, i) => (
                  <View key={i} style={{ flex: 1, flexDirection: "row" }}>
                    {i === 1 && <View style={s.cardGap} />}
                    <View style={s.card}>
                      <View style={{ flexDirection: "row" }}>
                        <Text style={s.cardTitle}>{p.title}</Text>
                        {p.year && <Text style={{ fontSize: 7.6, fontWeight: 900, color: C.muted }}>{p.year}</Text>}
                      </View>
                      {p.role && <Text style={s.cardRole}>{p.role}</Text>}
                      {p.description && <Text style={s.entryText}>{p.description}</Text>}
                      {p.tools && <Text style={s.small}>Herramientas: {p.tools}</Text>}
                      {p.url && (
                        <Link src={p.url} style={[s.small, s.link]}>
                          {shortUrl(p.url)}
                        </Link>
                      )}
                    </View>
                  </View>
                ))}
                {row.length === 1 && <View style={{ flex: 1, marginLeft: 7 }} />}
              </View>
            ))}
          </View>
        )}

        {detail.skills.length > 0 && (
          <View style={s.section}>
            <Heading s={s}>Competencias técnicas</Heading>
            <View style={s.legend}>
              {[1, 2, 3].map((l) => (
                <View key={l} style={s.legendItem}>
                  <Dots s={s} level={l} />
                  <Text style={{ marginLeft: 3 }}>
                    <Text style={{ fontWeight: 900, color: C.text }}>{SKILL_LEVEL[l]}</Text>: {LEVEL_MEANING[l]}
                  </Text>
                </View>
              ))}
            </View>
            {Object.entries(skillsByDomain).map(([domain, list]) => (
              <View key={domain} style={s.domain} wrap={false}>
                <Text style={s.domainLabel}>{domain}</Text>
                <View style={s.skills}>
                  {list.map((sk) => (
                    <View key={sk.name} style={s.skill}>
                      <Dots s={s} level={sk.level} />
                      <Text style={s.skillName}>
                        {sk.name}
                        {sk.pending ? <Text style={{ color: C.muted }}> (en revisión)</Text> : null}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={s.section}>
          <Heading s={s}>Formación</Heading>
          <View wrap={false}>
            <Text style={s.degree}>{detail.program}</Text>
            <Text style={s.small}>
              Universidad Nacional de Colombia, Sede Manizales · {level} · {status}
              {detail.graduation_date ? ` · ${detail.academic_status === "egresado" ? "grado" : "grado estimado"} ${formatMonth(detail.graduation_date)}` : ""}
            </Text>
          </View>
          {detail.subjects.length > 0 && (
            <View wrap={false}>
              <Text style={s.sub}>Asignaturas destacadas</Text>
              <View style={s.twoCols}>
                {detail.subjects.map((sub, i) => (
                  <Text key={i} style={[s.half, { fontSize: 8.4 }]}>
                    <Text style={{ fontWeight: 900, color: C.ink }}>{sub.name}</Text>
                    {sub.reason ? `: ${sub.reason}` : ""}
                  </Text>
                ))}
              </View>
            </View>
          )}
          {detail.courses.length > 0 && (
            <View>
              <Text style={s.sub} minPresenceAhead={20}>
                Cursos y certificaciones
              </Text>
              {detail.courses.map((c, i) => (
                <View key={i} style={s.listItem} wrap={false}>
                  <View style={s.bullet} />
                  <Text style={{ flex: 1, fontSize: 8.4 }}>
                    <Text style={{ fontWeight: 900, color: C.ink }}>{c.name}</Text>
                    {c.institution ? ` · ${c.institution}` : ""}
                    {c.year ? ` · ${c.year}` : ""}
                    {c.hours ? ` · ${c.hours} h` : ""}
                    {c.url ? (
                      <Link src={c.url} style={s.link}>
                        {`  ·  verificar: ${shortUrl(c.url)}`}
                      </Link>
                    ) : null}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {detail.honors && (
            <View style={s.honors} wrap={false}>
              <Text>
                <Text style={{ fontWeight: 900, color: C.ink }}>Reconocimientos: </Text>
                {detail.honors}
              </Text>
            </View>
          )}
        </View>

        {detail.outputs.length > 0 && (
          <View style={s.section}>
            <Heading s={s}>Publicaciones y eventos</Heading>
            {detail.outputs.map((o, i) => (
              <View key={i} style={s.output} wrap={false}>
                <Text style={s.outputKind}>{OUTPUT_KIND[o.kind]}</Text>
                <View style={{ flex: 1 }}>
                  {o.title ? (
                    <Text style={{ fontWeight: 900, color: C.ink }}>{o.title}</Text>
                  ) : (
                    <Text style={{ color: C.muted }}>Título reservado para empresas autorizadas</Text>
                  )}
                  <Text style={s.small}>{[o.venue, o.year].filter(Boolean).join(" · ")}</Text>
                  {o.url && (
                    <Link src={o.url} style={[s.small, s.link]}>
                      {shortUrl(o.url)}
                    </Link>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={s.grid}>
          {detail.languages.length > 0 && (
            <View style={s.cell} wrap={false}>
              <Text style={s.cellTitle}>Idiomas</Text>
              {detail.languages.map((l, i) => (
                <Text key={i} style={{ fontSize: 8.4 }}>
                  <Text style={{ fontWeight: 900, color: C.ink }}>
                    {l.language} {l.level}
                  </Text>
                  {l.certificate ? ` · ${l.certificate}` : ""}
                </Text>
              ))}
            </View>
          )}
          {detail.soft_skills.length > 0 && (
            <View style={s.cell} wrap={false}>
              <Text style={s.cellTitle}>Competencias transversales</Text>
              <Text style={{ fontSize: 8.4 }}>{detail.soft_skills.join(" · ")}</Text>
            </View>
          )}
          <View style={s.cell} wrap={false}>
            <Text style={s.cellTitle}>Disponibilidad</Text>
            {detail.practice_period && <KV s={s} k="Periodo" v={detail.practice_period} />}
            {detail.available_from && <KV s={s} k="Desde" v={formatDate(detail.available_from)} />}
            {detail.available_until && <KV s={s} k="Hasta" v={formatDate(detail.available_until)} />}
            {detail.duration_months && <KV s={s} k="Duración" v={`${detail.duration_months} meses`} />}
            {detail.practice_cities && <KV s={s} k="Puede en" v={detail.practice_cities} />}
            {detail.can_relocate !== null && <KV s={s} k="Se traslada" v={detail.can_relocate ? "Sí" : "No"} />}
          </View>
          {(detail.areas.length > 0 || detail.target_companies) && (
            <View style={s.cell} wrap={false}>
              <Text style={s.cellTitle}>Intereses</Text>
              {detail.areas.length > 0 && <Text style={{ fontSize: 8.4 }}>{detail.areas.join(" · ")}</Text>}
              {detail.target_companies && (
                <Text style={[s.small, { color: C.text }]}>
                  <Text style={{ fontWeight: 900, color: C.ink }}>Sectores u organizaciones: </Text>
                  {detail.target_companies}
                </Text>
              )}
            </View>
          )}
        </View>

        <Text style={s.closing} wrap={false}>
          Documento generado el {generatedAt.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" })} desde el sistema de prácticas de la Facultad de Ciencias Exactas y Naturales, Universidad Nacional de Colombia, Sede Manizales. Uso exclusivo para procesos de práctica.
        </Text>
      </Page>
    </Document>
  );
}

function KV({ s, k, v }: { s: Styles; k: string; v: string }) {
  return (
    <View style={s.kv}>
      <Text style={s.kvKey}>{k}</Text>
      <Text style={s.kvValue}>{v}</Text>
    </View>
  );
}

export async function renderCv(detail: StudentDetail, { photo, generatedAt = new Date() }: { photo: Buffer | null; generatedAt?: Date }) {
  const f = await ensureFonts();
  return renderToBuffer(<CvDocument detail={detail} photo={photo} generatedAt={generatedAt} f={f} />);
}
