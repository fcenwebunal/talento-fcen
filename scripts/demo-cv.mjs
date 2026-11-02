// Fills the CV fields added on 2026-11-02 for the demo students (fictional data): experience types, highlights,
// PAPA and who sees it, estimated graduation, sectors, project role and tools, and publications and events.
// Only touches demo accounts (email «.demo@») and only empty fields, so it can run more than once.
// Run: node --env-file=.env.local scripts/demo-cv.mjs
import { createClient } from "@supabase/supabase-js";

const admin = createClient("https://iwpnsyuvqvmdlsbkbzly.supabase.co", process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const EVENTS = {
  cim: ["XIII Congreso Internacional de Materiales (CIM 2026)", "https://fcen.unal.edu.co/menu/link-eventos/xiii-congreso-internacional-de-materiales/"],
  workshop: ["2do Workshop Internacional de Estadística 2026", "https://fcen.unal.edu.co/2do-workshop-internacional-de-estadistica-2026/"],
  encc: ["I Encuentro Nacional de Ciencias de la Computación (ENCC)", "https://fcen.unal.edu.co/encc2026/"],
  ciim: ["XVIII Competencia Iberoamericana Interuniversitaria de Matemáticas", "https://fcen.unal.edu.co/menu/link-eventos/xviii-competencia-iberoamericana-interuniversitaria-de-matematicas/"],
  semilleros: ["Encuentro de Semilleros de Investigación, UNAL Manizales", null],
};

const GROUPS = {
  estadistica: {
    highlights: [
      "Reduje en 35 % el error de pronóstico de ventas semanales de una tienda con modelos ARIMA en R.",
      "Diseñé el muestreo de una encuesta a 1.200 estudiantes con un margen de error del 3 %.",
      "Automaticé en R un informe mensual que tomaba 2 días y ahora se genera en 15 minutos.",
      "Construí un tablero en Power BI que usan 3 dependencias para seguir 20 indicadores.",
    ],
    tools: ["R", "Python", "SQL", "Power BI", "Excel", "Shiny"],
    sectors: "Banca y seguros, entidades de estadística pública y consultoras de investigación de mercados",
    outputs: [
      ["poster", "Modelos de series de tiempo para la demanda de energía en Caldas", "workshop", 2026],
      ["ponencia", "Muestreo estratificado en encuestas de movilidad estudiantil", "workshop", 2026],
      ["evento", "Curso corto de estadística bayesiana", "workshop", 2026],
    ],
    extra: { organization: "Seguros La Cumbre", role: "Auxiliar de analítica (medio tiempo)", kind: "laboral", description: "Depuré la base de siniestros de 2024 y preparé reportes mensuales de frecuencia y severidad para el área técnica." },
  },
  computacion: {
    highlights: [
      "Desarrollé una API en Python que atiende 5.000 consultas diarias con respuestas de menos de 200 ms.",
      "Entrené un modelo de clasificación de imágenes con 92 % de exactitud usando PyTorch.",
      "Reduje a la mitad el tiempo de despliegue de un proyecto del semillero con Docker y GitHub Actions.",
      "Obtuve el segundo puesto entre 40 equipos en una maratón regional de programación.",
    ],
    tools: ["Python", "TypeScript", "React", "Docker", "Git", "PostgreSQL", "PyTorch"],
    sectors: "Empresas de software, fintech y tecnología para el agro",
    outputs: [
      ["ponencia", "Detección de enfermedades en hojas de café con redes neuronales", "encc", 2026],
      ["poster", "Una API abierta para datos de movilidad en Manizales", "encc", 2026],
    ],
    extra: { organization: "Torre Norte Software", role: "Desarrollador en formación", kind: "practica", description: "Implementé pruebas automáticas para un módulo de facturación y subí la cobertura de 40 % a 75 %." },
  },
  matematicas: {
    highlights: [
      "Implementé un método numérico que resolvió un problema de difusión 10 veces más rápido que la versión base.",
      "Formulé un modelo de optimización que redujo en 18 % los costos de ruteo de una flota simulada.",
      "Fui monitor de Cálculo Diferencial para 120 estudiantes durante dos semestres.",
      "Representé a la Universidad en la Competencia Iberoamericana Interuniversitaria de Matemáticas.",
    ],
    tools: ["Python", "MATLAB", "SageMath", "LaTeX", "NumPy"],
    sectors: "Analítica y riesgo financiero, centros de investigación y educación",
    outputs: [
      ["evento", "Participación en la competencia por equipos", "ciim", 2026],
      ["ponencia", "Elementos finitos para ecuaciones de difusión", "semilleros", 2025],
    ],
    extra: { organization: "Departamento de Matemáticas y Estadística, UNAL Manizales", role: "Monitor de Cálculo Diferencial", kind: "monitoria", description: "Preparé talleres semanales y acompañé a 120 estudiantes; la aprobación del grupo subió 12 puntos." },
  },
  fisica: {
    highlights: [
      "Calibré un sistema de sensores de temperatura con una incertidumbre menor a 0,1 °C.",
      "Diseñé un prototipo con Arduino que registra 6 variables ambientales en tiempo real.",
      "Caractericé 25 muestras de películas delgadas por difracción de rayos X.",
      "Presenté un póster sobre materiales magnéticos en un congreso internacional.",
    ],
    tools: ["Arduino", "LabVIEW", "Python", "COMSOL", "MATLAB"],
    sectors: "Manufactura e instrumentación, energía solar y laboratorios de metrología",
    outputs: [
      ["poster", "Propiedades magnéticas de películas delgadas de ferrita", "cim", 2026],
      ["ponencia", "Sensores de bajo costo para monitoreo ambiental", "cim", 2026],
    ],
    extra: { organization: "Laboratorio de Física del Plasma, UNAL Manizales", role: "Auxiliar de laboratorio", kind: "investigacion", description: "Operé el sistema de deposición y documenté 30 ensayos de recubrimientos con su caracterización." },
  },
  biologica: {
    highlights: [
      "Aumenté en 20 % el rendimiento de biomasa de levadura ajustando el medio de cultivo en un biorreactor de 2 L.",
      "Establecí un protocolo de micropropagación con una tasa de multiplicación 1,5 veces mayor que la base.",
      "Procesé 300 secuencias de bacterias del suelo con herramientas de bioinformática.",
      "Implementé un registro de buenas prácticas de laboratorio que redujo los errores de trazabilidad.",
    ],
    tools: ["R", "Python", "Excel", "BLAST", "Biorreactor"],
    sectors: "Alimentos y bebidas, farmacéutica y agroindustria del café",
    outputs: [
      ["poster", "Producción de biomasa de levadura en biorreactor de 2 L", "semilleros", 2025],
      ["ponencia", "Micropropagación de plátano con un protocolo optimizado", "semilleros", 2026],
    ],
    extra: { organization: "BioAndes Laboratorios", role: "Practicante de control de calidad", kind: "practica", description: "Validé 4 métodos de análisis microbiológico y llevé el control de 200 muestras mensuales." },
  },
};
GROUPS.actuaria = {
  ...GROUPS.matematicas,
  highlights: [
    "Construí una tabla de mortalidad ajustada para una cartera simulada de 10.000 asegurados.",
    "Valoré tres productos de ahorro programado con flujos de caja descontados en Excel y R.",
    ...GROUPS.matematicas.highlights.slice(1, 2),
  ],
  sectors: "Aseguradoras, fondos de pensiones y banca",
};

const ROLES = ["Líder del proyecto", "Análisis de datos", "Desarrollo y pruebas", "Modelación", "Diseño experimental", "Integrante del equipo"];

function groupFor(program) {
  const p = (program ?? "").toLowerCase();
  if (p.includes("actuar")) return "actuaria";
  if (p.includes("estad")) return "estadistica";
  if (p.includes("comput")) return "computacion";
  if (p.includes("biol")) return "biologica";
  if (p.includes("física") || p.includes("fisica") || p.includes("nano") || p.includes("materiales")) return "fisica";
  return "matematicas";
}

function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function kindFor(organization, role) {
  const t = `${organization} ${role ?? ""}`.toLowerCase();
  if (t.includes("semillero") || t.includes("grupo") || t.includes("laboratorio")) return "investigacion";
  if (t.includes("monitor")) return "monitoria";
  if (t.includes("voluntari")) return "voluntariado";
  if (t.includes("práctica") || t.includes("practicante")) return "practica";
  return "laboral";
}

const { data: students, error } = await admin
  .from("students")
  .select("id, academic_status, progress_pct, papa, highlights, graduation_date, target_companies, profiles!inner(email), programs(name)")
  .like("profiles.email", "%.demo@%");
if (error) throw error;

let touched = 0;
for (const st of students) {
  const h = hash(st.id);
  const group = GROUPS[groupFor(st.programs?.name)];
  const patch = {};
  if (!st.highlights?.length) {
    patch.highlights = [0, 1, 2].slice(0, 2 + (h % 2)).map((k) => group.highlights[(h + k) % group.highlights.length]);
    patch.papa_visibility = ["autorizadas", "autorizadas", "facultad", "autorizadas", "nadie"][h % 5];
  }
  if (st.papa === null) patch.papa = Math.round((3.6 + ((h >>> 3) % 12) / 10) * 10) / 10;
  if (!st.graduation_date) {
    const months = st.academic_status === "egresado" ? -((h % 8) + 2) : Math.max(4, Math.round((100 - (st.progress_pct ?? 70)) / 4));
    const d = new Date();
    d.setMonth(d.getMonth() + months, 1);
    patch.graduation_date = d.toISOString().slice(0, 10);
  }
  if (!st.target_companies) patch.target_companies = group.sectors;
  const { error: e1 } = await admin.from("students").update(patch).eq("id", st.id);
  if (e1) throw e1;

  const { data: experiences } = await admin.from("experiences").select("id, organization, role, kind").eq("student_id", st.id);
  for (const e of experiences ?? []) {
    const kind = kindFor(e.organization, e.role);
    if (e.kind !== kind) await admin.from("experiences").update({ kind }).eq("id", e.id);
  }
  if ((experiences ?? []).length < 2 && h % 2 === 0) {
    await admin.from("experiences").insert({ student_id: st.id, ...group.extra, start_date: "2025-07-01", end_date: h % 4 === 0 ? null : "2026-05-30" });
  }

  const { data: projects } = await admin.from("projects").select("id, role, tools").eq("student_id", st.id).order("id");
  for (const [k, pj] of (projects ?? []).entries()) {
    if (pj.role && pj.tools) continue;
    const tools = [0, 1, 2].map((j) => group.tools[(h + k + j * 2) % group.tools.length]);
    await admin.from("projects").update({ role: pj.role ?? ROLES[(h + k) % ROLES.length], tools: pj.tools ?? [...new Set(tools)].join(", ") }).eq("id", pj.id);
  }

  const { count } = await admin.from("student_outputs").select("id", { count: "exact", head: true }).eq("student_id", st.id);
  if (!count && h % 3 !== 0) {
    const picks = group.outputs.slice(0, 1 + (h % group.outputs.length));
    await admin.from("student_outputs").insert(
      picks.map(([kind, title, event, year]) => ({ student_id: st.id, kind, title, venue: EVENTS[event][0], year, url: EVENTS[event][1] }))
    );
  }
  touched++;
}
console.log(`Estudiantes demo con hoja de vida completa: ${touched}`);
