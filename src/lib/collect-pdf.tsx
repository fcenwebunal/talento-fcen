import "server-only";
import { Document, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatDate } from "./labels";
import { ensureFonts } from "./cv-pdf";
import type { CollectedStudent } from "./collect";

// Printable summary of the students available for a practice, for the Faculty to send to companies.

const C = { ink: "#151c27", text: "#262f3b", muted: "#4d5866", line: "#d3dae2", band: "#eef1f4", navy: "#0b2e59", blue: "#13477c", green: "#7ab317" };
const decimal = (n: number) => n.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const LEVEL_WORD = ["", "básico", "intermedio", "avanzado"];

function makeStyles(f: { sans: string; serif: string }) {
  return StyleSheet.create({
    page: { paddingTop: 30, paddingBottom: 34, paddingHorizontal: 36, fontFamily: f.sans, fontSize: 8.6, lineHeight: 1.35, color: C.text },
    pageNumber: { position: "absolute", bottom: 14, right: 36, fontSize: 7, color: C.muted },
    band: { backgroundColor: C.band, borderTopWidth: 3, borderTopColor: C.green, borderRadius: 3, paddingVertical: 11, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", marginBottom: 10 },
    kicker: { fontSize: 6.8, fontWeight: 900, letterSpacing: 1.3, textTransform: "uppercase", color: C.muted },
    title: { fontSize: 16, fontWeight: 900, color: C.ink, marginTop: 1 },
    subtitle: { fontFamily: f.serif, fontStyle: "italic", fontWeight: 700, fontSize: 9.5, color: C.text, marginTop: 2 },
    brand: { width: 150, alignItems: "flex-end" },
    brandMark: { fontSize: 14, fontWeight: 900, color: C.navy, lineHeight: 1 },
    brandName: { fontSize: 6.3, color: C.muted, textAlign: "right", marginTop: 2, lineHeight: 1.3 },
    note: { fontSize: 7.4, color: C.muted, marginBottom: 8 },
    entry: { borderWidth: 0.75, borderColor: C.line, borderLeftWidth: 2.5, borderLeftColor: C.navy, borderRadius: 3, padding: 7, marginBottom: 6 },
    head: { flexDirection: "row", justifyContent: "space-between" },
    name: { flex: 1, fontSize: 9.6, fontWeight: 900, color: C.ink, paddingRight: 8 },
    program: { fontSize: 7.8, color: C.blue, fontWeight: 900 },
    meta: { fontSize: 7.6, color: C.muted, marginTop: 2 },
    label: { fontWeight: 900, color: C.ink },
    skills: { fontSize: 8, color: C.text, marginTop: 3 },
    contact: { flexDirection: "row", flexWrap: "wrap", marginTop: 3 },
    link: { fontSize: 7.4, color: C.blue, textDecoration: "none", marginRight: 10 },
    closing: { marginTop: 12, fontSize: 7, color: C.muted, textAlign: "center" },
  });
}

export async function renderCollectionPdf(students: CollectedStudent[], { filtersText, generatedAt = new Date() }: { filtersText: string; generatedAt?: Date }) {
  const f = await ensureFonts();
  const s = makeStyles(f);
  const withContact = students.filter((st) => st.name).length;
  const date = generatedAt.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });

  const doc = (
    <Document title="Estudiantes disponibles para práctica" subject="Facultad de Ciencias Exactas y Naturales" language="es-CO" creator="FCEN, UNAL Manizales" producer="FCEN, UNAL Manizales">
      <Page size="LETTER" style={s.page}>
        <Text style={s.pageNumber} fixed render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : "")} />
        <View style={s.band} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={s.kicker}>Prácticas y conexión con las organizaciones</Text>
            <Text style={s.title}>Estudiantes disponibles para práctica</Text>
            <Text style={s.subtitle}>
              {students.length} {students.length === 1 ? "perfil" : "perfiles"} · {date}
            </Text>
          </View>
          <View style={s.brand}>
            <Text style={s.brandMark}>FCEN</Text>
            <Text style={s.brandName}>{"Facultad de Ciencias Exactas y Naturales\nUniversidad Nacional de Colombia\nSede Manizales"}</Text>
          </View>
        </View>
        <Text style={s.note}>
          {filtersText}. Nombre y correo solo de quienes aceptaron compartir su contacto ({withContact} de {students.length}); los demás aparecen como perfil anónimo y se pueden
          contactar a través de la Facultad. Niveles: básico, lo usó en clase; intermedio, en un proyecto real; avanzado, puede enseñarlo.
        </Text>

        {students.map((st) => (
          <View key={st.id} style={s.entry} wrap={false}>
            <View style={s.head}>
              <Text style={s.name}>{st.name ?? "Perfil anónimo"}</Text>
              <Text style={s.program}>
                {st.program} · {st.level}
              </Text>
            </View>
            {st.headline && <Text style={{ fontSize: 8.2, color: C.text, marginTop: 1 }}>{st.headline}</Text>}
            <Text style={s.meta}>
              {st.status} · {st.availability}
              {st.progress !== null ? ` · avance ${decimal(st.progress)} % (${st.progressNote})` : ""}
              {st.papa !== null ? ` · PAPA ${decimal(st.papa)}` : ""}
              {st.period ? ` · práctica ${st.period}` : ""}
              {st.from ? ` desde el ${formatDate(st.from)}` : ""}
              {st.city ? ` · ${st.city}` : ""}
              {st.modalities ? ` · ${st.modalities}` : ""}
              {st.languages ? ` · ${st.languages}` : ""}
            </Text>
            {st.skills.length > 0 && (
              <Text style={s.skills}>
                <Text style={s.label}>Habilidades: </Text>
                {st.skills.map((k) => `${k.name} (${LEVEL_WORD[k.level]})`).join(" · ")}
              </Text>
            )}
            <View style={s.contact}>
              {st.email && (
                <Link src={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(st.email)}`} style={s.link}>
                  {st.email}
                </Link>
              )}
              <Link src={st.link} style={s.link}>
                Ver perfil completo
              </Link>
            </View>
          </View>
        ))}

        <Text style={s.closing} wrap={false}>
          Documento generado el {date} desde el sistema de prácticas de la Facultad de Ciencias Exactas y Naturales, Universidad Nacional de Colombia, Sede Manizales. Uso exclusivo para procesos de práctica.
        </Text>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
