// Demo data for the beta: fictional students, companies, photos, logos, CVs and activity.
// Run: node --env-file=.env.local scripts/demo-seed.mjs          (replaces previous demo data)
//      node --env-file=.env.local scripts/demo-seed.mjs --clean  (only removes demo data)
//      node --env-file=.env.local scripts/demo-seed.mjs --passwords  (sets DEMO_PASSWORD on every demo account)
// Demo accounts use DEMO_PASSWORD from .env.local when present; otherwise a random password (they cannot log in).
// Everything demo is marked: student emails demo.*@unal.edu.co, company emails demo.*@example.com, company NIT DEMO-*.
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const admin = createClient("https://iwpnsyuvqvmdlsbkbzly.supabase.co", process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
const PASSWORD = process.env.DEMO_PASSWORD || randomBytes(18).toString("base64url");

let seed = 20261101;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const sample = (arr, n) => [...arr].sort(() => rand() - 0.5).slice(0, n);
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();
const dateIn = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

const COLORS = [["#13477c", "#0c6896"], ["#0b2e59", "#13477c"], ["#3f6a00", "#7ab317"], ["#0c6896", "#3fa3c9"], ["#8a5d00", "#ecb01b"], ["#c1390a", "#e0662e"], ["#4b2a7b", "#7b55b5"]];

// ---------- content ----------
const PROGRAM_CONTENT = {
  estadistica: {
    skills: ["R", "Python", "SQL", "Diseño de experimentos", "Muestreo y encuestas", "Modelos de regresión", "Series de tiempo", "Estadística bayesiana", "Análisis multivariado", "Power BI", "Visualización de datos", "Control estadístico de la calidad", "Bioestadística", "Excel avanzado", "Aprendizaje estadístico"],
    headlines: ["Estadística con experiencia en encuestas y R", "Análisis de datos y tableros para la toma de decisiones", "Series de tiempo y pronósticos de demanda", "Bioestadística aplicada a estudios de salud"],
    about: "Estudiante de Estadística con interés en convertir datos en decisiones. He trabajado con encuestas, modelos de regresión y tableros de indicadores. Me gusta explicar resultados de forma clara a personas sin formación técnica y aprender rápido nuevas herramientas.",
    projects: [["Pronóstico de demanda para una tienda de barrio", "Modelé ventas semanales con modelos ARIMA en R y reduje el error de pronóstico frente al promedio simple."], ["Encuesta de movilidad estudiantil", "Diseñé el muestreo estratificado y analicé 600 respuestas; los resultados se presentaron a Bienestar."], ["Tablero de indicadores de calidad", "Construí un tablero en Power BI con cartas de control para un proceso de empaque."]],
    subjects: [["Diseño de experimentos", "Planear y analizar ensayos en procesos industriales"], ["Muestreo", "Diseñar encuestas representativas"], ["Series de tiempo", "Pronósticos para planeación"], ["Regresión", "Modelar relaciones entre variables de negocio"]],
    areas: ["Análisis de datos y estadística", "Finanzas, riesgo y modelamiento", "Sector público y políticas basadas en datos", "Laboratorio, calidad y control de procesos"],
  },
  "ciencias-computacion": {
    skills: ["Python", "Java", "JavaScript y TypeScript", "SQL", "Git", "Linux", "Docker", "Algoritmos y estructuras de datos", "Desarrollo web", "Desarrollo de software", "Bases de datos", "Aprendizaje automático", "Seguridad informática", "Criptografía", "Computación en la nube"],
    headlines: ["Desarrollo web full stack con TypeScript", "Aprendizaje automático aplicado y ciencia de datos", "Seguridad informática y criptografía", "Algoritmos, optimización y backend"],
    about: "Estudiante de Ciencias de la Computación. Disfruto construir software que resuelva problemas reales, desde la base de datos hasta la interfaz. He participado en proyectos de grupo con control de versiones y revisiones de código, y busco una práctica donde pueda aportar y aprender buenas prácticas de la industria.",
    projects: [["Aplicación de reservas para laboratorios", "Desarrollé con Next.js y PostgreSQL un sistema de reservas usado por un semillero de 30 personas."], ["Clasificador de imágenes de cultivos", "Entrené una red convolucional con PyTorch para detectar enfermedades en hojas de café."], ["Auditoría de seguridad de una red local", "Analicé vulnerabilidades con herramientas abiertas y propuse un plan de mitigación."]],
    subjects: [["Estructuras de datos", "Diseñar soluciones eficientes"], ["Bases de datos", "Modelar y consultar información"], ["Ingeniería de software", "Trabajo en equipo y metodologías ágiles"], ["Criptografía", "Fundamentos de seguridad"]],
    areas: ["Desarrollo de software y tecnología", "Análisis de datos y estadística", "Ciberseguridad y criptografía", "Investigación y desarrollo"],
  },
  matematicas: {
    skills: ["Modelación matemática", "Análisis numérico", "Optimización", "Investigación de operaciones", "Ecuaciones diferenciales", "Probabilidad", "Matemática financiera", "Python", "MATLAB u Octave", "LaTeX", "SageMath", "R", "Docencia", "Tutoría académica", "Criptografía"],
    headlines: ["Modelación matemática y optimización", "Matemática financiera y gestión de riesgo", "Docencia y divulgación de las matemáticas", "Investigación de operaciones aplicada a logística"],
    about: "Estudiante de Matemáticas con gusto por los problemas difíciles. Traduzco situaciones reales a modelos y uso herramientas computacionales para resolverlos. Tengo experiencia como monitor y me interesa aplicar la matemática en la industria, las finanzas o la logística.",
    projects: [["Optimización de rutas de recolección", "Formulé un problema de ruteo de vehículos y lo resolví con programación entera para 25 puntos de recolección."], ["Modelo de propagación epidemiológica", "Simulé un modelo SIR con ecuaciones diferenciales y analicé escenarios de vacunación."], ["Material didáctico de cálculo", "Diseñé guías y ejercicios interactivos usados en monitorías de primer semestre."]],
    subjects: [["Análisis numérico", "Resolver problemas con métodos computacionales"], ["Optimización", "Tomar decisiones con restricciones"], ["Probabilidad", "Modelar incertidumbre"], ["Ecuaciones diferenciales", "Modelar sistemas dinámicos"]],
    areas: ["Finanzas, riesgo y modelamiento", "Investigación y desarrollo", "Docencia y divulgación", "Análisis de datos y estadística"],
  },
  "ingenieria-fisica": {
    skills: ["Instrumentación y metrología", "Sensores", "Electrónica", "Ciencia de materiales", "Caracterización de materiales", "Óptica y optoelectrónica", "Física del plasma", "Simulación de sistemas físicos", "LabVIEW", "Arduino", "Raspberry Pi", "MATLAB u Octave", "Python", "COMSOL", "CAD"],
    headlines: ["Instrumentación, sensores y automatización", "Caracterización de materiales y óptica", "Simulación y desarrollo de prototipos", "Energía solar y física del plasma"],
    about: "Estudiante de Ingeniería Física con formación experimental. Me siento cómodo en el laboratorio diseñando montajes, calibrando instrumentos y analizando datos. Busco una práctica en la que pueda aplicar la física a problemas de medición, materiales o automatización en la industria.",
    projects: [["Estación de monitoreo ambiental", "Construí con Arduino y sensores de bajo costo una estación que reporta temperatura, humedad y material particulado."], ["Caracterización óptica de películas delgadas", "Medí transmitancia y estimé el ancho de banda prohibida de recubrimientos en el laboratorio."], ["Control de temperatura de un horno", "Implementé un control PID en LabVIEW para un horno de tratamiento térmico."]],
    subjects: [["Instrumentación electrónica", "Diseñar sistemas de medición"], ["Física del estado sólido", "Entender propiedades de materiales"], ["Óptica", "Técnicas ópticas de caracterización"], ["Control", "Automatizar procesos"]],
    areas: ["Instrumentación, electrónica y automatización", "Materiales, óptica y nanotecnología", "Energía", "Laboratorio, calidad y control de procesos"],
  },
  "ingenieria-biologica": {
    skills: ["Biología molecular", "Microbiología", "Cultivos in vitro", "Biorreactores", "Bioprocesos", "Biotecnología", "Bioinformática", "Buenas prácticas de laboratorio", "Buenas prácticas de manufactura", "Python", "R", "Excel avanzado"],
    headlines: ["Bioprocesos y control microbiológico", "Biotecnología vegetal y cultivos in vitro", "Bioinformática y análisis de datos biológicos", "Calidad en la industria de alimentos"],
    about: "Estudiante de Ingeniería Biológica con experiencia en laboratorio de microbiología y bioprocesos. Me interesa optimizar procesos con organismos vivos para la industria de alimentos, farmacéutica o ambiental, siempre con rigor en buenas prácticas y documentación.",
    projects: [["Producción de biomasa de levadura", "Operé un biorreactor de 2 L, monitoreé variables y comparé rendimientos entre medios de cultivo."], ["Micropropagación de plátano", "Establecí protocolos de cultivo in vitro con tasas de multiplicación superiores al protocolo base."], ["Análisis de secuencias de bacterias del suelo", "Procesé secuencias con herramientas de bioinformática para identificar géneros dominantes."]],
    subjects: [["Microbiología", "Control de calidad microbiológico"], ["Bioprocesos", "Escalar procesos biológicos"], ["Biología molecular", "Técnicas de diagnóstico"], ["Biorreactores", "Operación y control"]],
    areas: ["Biotecnología y bioprocesos", "Laboratorio, calidad y control de procesos", "Medio ambiente y sostenibilidad", "Investigación y desarrollo"],
  },
};
PROGRAM_CONTENT["esp-estadistica"] = { ...PROGRAM_CONTENT.estadistica, headlines: ["Econometría y ciencia de datos para el sector financiero"] };
PROGRAM_CONTENT["esp-actuaria-finanzas"] = { ...PROGRAM_CONTENT.matematicas, skills: ["Actuaría", "Matemática financiera", "Probabilidad", "Econometría", "R", "Python", "Excel avanzado", "SQL", "Modelos de regresión"], headlines: ["Actuaría, seguros y gestión de riesgo"] };
PROGRAM_CONTENT["maestria-matematica-aplicada"] = { ...PROGRAM_CONTENT.matematicas, headlines: ["Modelación y simulación numérica avanzada"] };
PROGRAM_CONTENT["maestria-fisica"] = { ...PROGRAM_CONTENT["ingenieria-fisica"], headlines: ["Física de materiales y técnicas de caracterización"] };
PROGRAM_CONTENT["esp-nanotecnologia"] = { ...PROGRAM_CONTENT["ingenieria-fisica"], skills: ["Nanotecnología", "Caracterización de materiales", "Ciencia de materiales", "Óptica y optoelectrónica", "Python", "MATLAB u Octave"], headlines: ["Nanomateriales para aplicaciones industriales"] };

const SOFT = ["Trabajo en equipo", "Comunicación oral y escrita", "Pensamiento analítico y resolución de problemas", "Liderazgo", "Adaptabilidad y aprendizaje autónomo", "Organización y manejo del tiempo", "Creatividad e innovación", "Orientación a resultados"];
const CITIES = ["Manizales", "Manizales", "Manizales", "Villamaría", "Chinchiná", "Pereira", "Armenia"];

const STUDENTS = [
  ["Valentina Ríos Arango", "estadistica", "disponible", 6, 88],
  ["Santiago Herrera Gil", "ciencias-computacion", "disponible", 12, 82],
  ["Mariana Ocampo López", "ingenieria-fisica", "disponible", 3, 90],
  ["Juan Esteban Cardona", "matematicas", "disponible", 40, 79],
  ["Laura Sofía Giraldo", "ingenieria-biologica", "disponible", 20, 74],
  ["Andrés Felipe Salazar", "ciencias-computacion", "en_proceso", 15, 85],
  ["Daniela Marín Restrepo", "estadistica", "disponible", 82, 81],
  ["Camilo Andrés Duque", "ingenieria-fisica", "en_practica", 60, 93],
  ["Isabella Castaño Mejía", "matematicas", "disponible", 9, 76],
  ["Mateo Zuluaga Henao", "ciencias-computacion", "disponible", 25, 71],
  ["Sara Valencia Montoya", "ingenieria-biologica", "en_proceso", 30, 80],
  ["Tomás Escobar Ramírez", "estadistica", "sin_confirmar", 110, 77],
  ["Natalia Franco Osorio", "ciencias-computacion", "no_disponible", 140, 68],
  ["Sebastián Arias Quintero", "ingenieria-fisica", "disponible", 50, 84],
  ["Manuela Gómez Patiño", "matematicas", "disponible", 2, 86],
  ["Felipe Londoño Vargas", "esp-estadistica", "disponible", 18, 60],
  ["Carolina Betancur Ruiz", "esp-actuaria-finanzas", "disponible", 7, 55],
  ["Alejandro Rendón Toro", "maestria-matematica-aplicada", "disponible", 33, 50],
  ["Juliana Agudelo Correa", "maestria-fisica", "en_proceso", 45, 45],
  ["David Soto Hincapié", "esp-nanotecnologia", "disponible", 14, 65],
  ["Paula Andrea Montes", "estadistica", "disponible", 70, 100, "egresado"],
  ["Nicolás Bedoya Arenas", "ciencias-computacion", "disponible", 5, 100, "egresado"],
];

const COMPANIES = [
  ["Analítica del Eje SAS", "Analítica de datos y consultoría", "pequena", "Manizales", "autorizada", "#13477c"],
  ["Cafeteros Digitales SAS", "Agroindustria y tecnología", "mediana", "Manizales", "autorizada", "#3f6a00"],
  ["Bioinsumos Andinos SAS", "Biotecnología agrícola", "mediana", "Chinchiná", "autorizada", "#0c6896"],
  ["Metrología Industrial de Caldas SAS", "Calibración e instrumentación", "pequena", "Manizales", "en_revision", "#8a5d00"],
  ["Seguros del Cafetal SA", "Seguros y actuaría", "grande", "Pereira", "en_revision", "#0b2e59"],
  ["Código Montaña SAS", "Desarrollo de software", "micro", "Manizales", "registrada", "#4b2a7b"],
  ["Laboratorio Ambiental Ruiz SAS", "Análisis ambiental", "pequena", "Villamaría", "registrada", "#3fa3c9"],
  ["Datos Express SAS", "Mercadeo digital", "micro", "Bogotá", "rechazada", "#c1390a"],
  ["Inversiones Nevado SAS", "Finanzas", "pequena", "Manizales", "suspendida", "#5f6b7a"],
];

// ---------- generators ----------
const slug = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

function makePdf(title, lines) {
  const esc = (t) => t.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  let y = 790;
  let stream = `0.043 0.18 0.349 rg 0 812 595 30 re f 0.478 0.702 0.09 rg 0 808 595 4 re f\n`;
  stream += `BT /F2 9 Tf 1 1 1 rg 40 822 Td (${esc("TALENTO FCEN - DOCUMENTO DE DEMOSTRACIÓN")}) Tj ET\n`;
  y = 770;
  stream += `BT /F2 22 Tf 0.043 0.18 0.349 rg 40 ${y} Td (${esc(title)}) Tj ET\n`;
  y -= 30;
  for (const [kind, text] of lines) {
    if (kind === "h") {
      y -= 8;
      stream += `BT /F2 12 Tf 0.075 0.278 0.486 rg 40 ${y} Td (${esc(text)}) Tj ET\n`;
      y -= 18;
    } else {
      const words = text.split(" ");
      let line = "";
      for (const w of words) {
        if ((line + " " + w).length > 92) {
          stream += `BT /F1 10 Tf 0.12 0.16 0.2 rg 40 ${y} Td (${esc(line.trim())}) Tj ET\n`;
          y -= 14;
          line = w;
        } else line += " " + w;
      }
      if (line.trim()) {
        stream += `BT /F1 10 Tf 0.12 0.16 0.2 rg 40 ${y} Td (${esc(line.trim())}) Tj ET\n`;
        y -= 14;
      }
    }
  }
  stream += `BT /F1 8 Tf 0.37 0.42 0.48 rg 40 30 Td (${esc("Datos ficticios generados para probar la plataforma. No corresponden a ninguna persona real.")}) Tj ET\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}endstream`,
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}

async function makeAvatar(i) {
  const [a, b] = COLORS[i % COLORS.length];
  const skin = ["#f1c9a5", "#e0ac83", "#c68b62", "#a8714b", "#8d5a3b"][i % 5];
  const hair = ["#2b1d14", "#4a3020", "#1c1c1c", "#6b4226", "#3a2a1f"][(i * 3) % 5];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <circle cx="330" cy="70" r="90" fill="#fff" opacity="0.08"/><circle cx="60" cy="360" r="70" fill="#7ab317" opacity="0.18"/>
    <path d="M70 400c10-80 60-120 130-120s120 40 130 120z" fill="#fff" opacity="0.92"/>
    <path d="M110 400c8-60 45-92 90-92s82 32 90 92z" fill="${a}" opacity="0.25"/>
    <circle cx="200" cy="175" r="72" fill="${skin}"/>
    <path d="M128 170c0-52 32-82 72-82s72 30 72 82c-16-26-40-38-72-38s-56 12-72 38z" fill="${hair}"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function makeLogo(name, color) {
  const initials = name.split(" ").filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="44" fill="${color}"/>
    <path d="M0 150 L200 90 L200 200 L0 200z" fill="#fff" opacity="0.12"/>
    <circle cx="160" cy="40" r="22" fill="#7ab317" opacity="0.9"/>
    <text x="100" y="122" font-family="Arial Black, Arial, sans-serif" font-size="72" font-weight="900" text-anchor="middle" fill="#fff">${initials}</text>
  </svg>`);
}

// ---------- clean ----------
async function listAllUsers() {
  const users = [];
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 200) break;
  }
  return users;
}

async function clean() {
  const { data: companies } = await admin.from("companies").select("id").like("nit", "DEMO-%");
  for (const c of companies ?? []) {
    const { data: files } = await admin.storage.from("logos").list(c.id);
    if (files?.length) await admin.storage.from("logos").remove(files.map((f) => `${c.id}/${f.name}`));
  }
  if (companies?.length) await admin.from("companies").delete().in("id", companies.map((c) => c.id));
  const users = (await listAllUsers()).filter((u) => /^demo\./.test(u.email ?? ""));
  for (const u of users) {
    for (const kind of ["foto", "hoja_vida", "historia_academica", "certificado"]) {
      const { data: files } = await admin.storage.from("documentos").list(`${u.id}/${kind}`);
      if (files?.length) await admin.storage.from("documentos").remove(files.map((f) => `${u.id}/${kind}/${f.name}`));
    }
    await admin.auth.admin.deleteUser(u.id);
  }
  return { companies: companies?.length ?? 0, users: users.length };
}

// ---------- seed ----------
async function createAccount(email, fullName) {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error) throw new Error(`${email}: ${error.message}`);
  return data.user.id;
}

async function seedStudents() {
  const [{ data: programs }, { data: skills }, { data: soft }, { data: areas }] = await Promise.all([
    admin.from("programs").select("id, slug"),
    admin.from("skills").select("id, name"),
    admin.from("soft_skills").select("id, name"),
    admin.from("areas").select("id, name"),
  ]);
  const programId = Object.fromEntries(programs.map((p) => [p.slug, p.id]));
  const skillId = Object.fromEntries(skills.map((s) => [s.name, s.id]));
  const softId = Object.fromEntries(soft.map((s) => [s.name, s.id]));
  const areaId = Object.fromEntries(areas.map((a) => [a.name, a.id]));
  const ids = [];

  for (const [i, [name, prog, availability, confirmedDaysAgo, progress, status = "activo"]] of STUDENTS.entries()) {
    const content = PROGRAM_CONTENT[prog];
    const email = `demo.${slug(name)}@unal.edu.co`;
    const id = await createAccount(email, name);
    ids.push({ id, name, prog, availability });
    await admin.from("profiles").update({ role: "student", full_name: name }).eq("id", id);

    const first = name.split(" ")[0].toLowerCase();
    const consentContact = !["no_disponible"].includes(availability) && i % 5 !== 4;
    const period = pick(["2027-1", "2027-1", "2027-2", "2026-2"]);
    const city = pick(CITIES);
    await admin.from("students").upsert({
      id,
      program_id: programId[prog],
      academic_status: status,
      graduation_date: status === "egresado" ? dateIn(-pick([60, 120, 200])) : null,
      progress_pct: progress,
      progress_verified: i % 3 === 0 ? "coordinacion" : i % 3 === 1 ? "documento" : "autodeclarado",
      progress_verified_at: i % 3 === 2 ? null : daysAgo(5),
      emphasis: i % 2 ? pick(content.areas) : null,
      honors: i % 4 === 0 ? "Monitora académica durante dos semestres. Beca de excelencia académica." : i % 4 === 1 ? "Ponente en el Encuentro Nacional de Semilleros de Investigación." : null,
      headline: pick(content.headlines),
      about: content.about,
      motivation: "Quiero aplicar lo aprendido en la carrera a problemas reales, aprender cómo trabaja un equipo profesional y salir con experiencia que me ayude a definir mi camino.",
      city,
      modalities: sample(["presencial", "remota", "hibrida"], 1 + Math.floor(rand() * 3)),
      dedication: pick(["completo", "completo", "medio", "cualquiera"]),
      can_relocate: rand() > 0.5,
      practice_cities: pick(["Manizales, Pereira", "Manizales", "Eje Cafetero o remoto", "Manizales, Bogotá, Medellín"]),
      target_companies: i % 3 === 0 ? "Empresas de tecnología o consultoría del Eje Cafetero" : null,
      practice_period: period,
      available_from: dateIn(pick([30, 60, 90])),
      available_until: dateIn(pick([200, 260, 320])),
      duration_months: pick([4, 5, 6]),
      practice_end_date: availability === "en_practica" ? dateIn(90) : null,
      availability,
      last_confirmed_at: daysAgo(confirmedDaysAgo),
      linkedin_url: `https://www.linkedin.com/in/${first}-demo-${i}`,
      github_url: ["ciencias-computacion", "estadistica"].includes(prog) ? `https://github.com/${first}-demo-${i}` : null,
      portfolio_url: i % 4 === 2 ? `https://${first}-demo.github.io` : null,
      consent_anonymous: availability !== "no_disponible",
      consent_contact: consentContact,
      consent_version: "2026-10-31",
      consent_at: daysAgo(confirmedDaysAgo),
      truthful_declared: true,
    });
    await admin.from("student_private").upsert({
      student_id: id,
      doc_type: "Cédula de ciudadanía",
      doc_number: `DEMO-${1000 + i}`,
      birth_date: `${2000 + (i % 5)}-0${1 + (i % 9)}-1${i % 9}`,
      phone: `300 000 ${String(1000 + i).padStart(4, "0")}`,
      personal_email: `demo.${first}${i}@example.com`,
      eps: pick(["EPS de demostración A", "EPS de demostración B"]),
      emergency_name: "Contacto de demostración",
      emergency_relation: pick(["Madre", "Padre", "Hermana", "Tío"]),
      emergency_phone: `310 000 ${String(2000 + i).padStart(4, "0")}`,
    });

    const chosen = sample(content.skills.filter((s) => skillId[s]), 5 + Math.floor(rand() * 5));
    await admin.from("student_skills").insert(
      chosen.map((s, k) => ({
        student_id: id,
        skill_id: skillId[s],
        level: k < 2 ? 3 : k < 5 ? 2 : 1,
        evidence_url: k === 0 ? `https://github.com/${first}-demo-${i}/proyecto` : null,
      }))
    );
    await admin.from("student_soft_skills").insert(sample(SOFT, 3 + Math.floor(rand() * 3)).map((s) => ({ student_id: id, soft_skill_id: softId[s] })));
    await admin.from("student_areas").insert(sample(content.areas, 2 + Math.floor(rand() * 2)).map((a) => ({ student_id: id, area_id: areaId[a] })));
    await admin.from("student_languages").insert([
      { student_id: id, language: "Inglés", level: pick(["A2", "B1", "B1", "B2", "C1"]), certificate: i % 3 === 0 ? "Sí, examen internacional" : "No" },
      ...(i % 4 === 0 ? [{ student_id: id, language: pick(["Francés", "Portugués", "Alemán"]), level: "A2", certificate: "No" }] : []),
    ]);
    await admin.from("relevant_subjects").insert(sample(content.subjects, 2 + Math.floor(rand() * 3)).map(([n, r]) => ({ student_id: id, name: n, reason: r })));
    await admin.from("projects").insert(sample(content.projects, 1 + Math.floor(rand() * 3)).map(([t, d], k) => ({ student_id: id, title: t, description: d, year: 2025 + (k % 2), url: k === 0 ? `https://github.com/${first}-demo-${i}/proyecto` : null })));
    if (i % 3 !== 2) {
      await admin.from("experiences").insert([
        { student_id: id, organization: pick(["Semillero de investigación de la Facultad", "Monitoría académica, UNAL Manizales", "Voluntariado de enseñanza STEM"]), role: pick(["Integrante", "Monitor", "Voluntario"]), start_date: "2025-02-01", end_date: i % 2 ? null : "2025-12-01", description: "Apoyo en actividades académicas, preparación de material y análisis de resultados." },
      ]);
    }
    await admin.from("courses").insert([
      { student_id: id, name: pick(["Curso de Python para análisis de datos", "Diplomado en ciencia de datos", "Taller de escritura científica", "Curso de buenas prácticas de laboratorio"]), institution: pick(["UNAL Educación Continua", "Plataforma en línea", "SENA"]), year: 2025, hours: pick([20, 40, 80, 120]) },
    ]);

    const cv = makePdf(`Hoja de vida: ${name}`, [
      ["p", `${prog.replace(/-/g, " ")} · Universidad Nacional de Colombia, Sede Manizales`],
      ["h", "Perfil"],
      ["p", content.about],
      ["h", "Habilidades"],
      ["p", chosen.join(", ")],
      ["h", "Proyectos"],
      ...content.projects.slice(0, 2).map(([t, d]) => ["p", `${t}: ${d}`]),
      ["h", "Contacto"],
      ["p", `${email} · 300 000 ${String(1000 + i).padStart(4, "0")}`],
    ]);
    const history = makePdf(`Historia académica: ${name}`, [
      ["p", `Programa: ${prog.replace(/-/g, " ")}`],
      ["p", `Porcentaje de avance: ${progress}%`],
      ["p", `Promedio (P.A.P.A.): ${(3.6 + rand() * 1.2).toFixed(1)}`],
      ["h", "Nota"],
      ["p", "Documento ficticio que simula el reporte del SIA para probar la carga y la verificación del avance."],
    ]);
    const uploads = [
      ["hoja_vida", `hoja-de-vida-${slug(name)}.pdf`, cv, "application/pdf"],
      ["historia_academica", `historia-academica-${slug(name)}.pdf`, history, "application/pdf"],
      ...(i % 6 !== 5 ? [["foto", `foto-${slug(name)}.png`, await makeAvatar(i), "image/png"]] : []),
    ];
    for (const [kind, file, buffer, type] of uploads) {
      const path = `${id}/${kind}/${Date.now()}-${file}`;
      const up = await admin.storage.from("documentos").upload(path, buffer, { contentType: type });
      if (up.error) throw new Error(`${file}: ${up.error.message}`);
      await admin.from("documents").insert({ student_id: id, kind, path, file_name: file, size_bytes: buffer.length });
    }
    process.stdout.write(".");
  }
  console.log(` ${ids.length} estudiantes`);
  return ids;
}

async function seedCompanies(students) {
  const created = [];
  for (const [i, [name, sector, size, city, status, color]] of COMPANIES.entries()) {
    const email = `demo.${slug(name).replace(/\.sas$|\.sa$/, "")}@example.com`;
    const contact = pick(["Ana María Pérez", "Carlos Jaramillo", "Lucía Restrepo", "Jorge Iván Mejía", "Diana Cárdenas"]);
    const userId = await createAccount(email, contact);
    const { data: company, error } = await admin
      .from("companies")
      .insert({
        nit: `DEMO-9000${String(i + 1).padStart(5, "0")}`,
        name,
        sector,
        size,
        city,
        website: `https://${slug(name).replace(/\.sas$|\.sa$/, "").replace(/\./g, "")}.example.com`,
        description: `${name} es una organización ficticia de demostración del sector ${sector.toLowerCase()} que busca practicantes de la FCEN.`,
        terms_version: "2026-10-31",
        terms_accepted_at: daysAgo(20 - i),
      })
      .select("id")
      .single();
    if (error) throw error;
    await admin.from("company_members").insert({ user_id: userId, company_id: company.id, member_role: "owner", contact_name: contact, position: pick(["Gerente de talento humano", "Directora de operaciones", "Líder de analítica"]), phone: `606 000 ${String(100 + i).padStart(4, "0")}` });
    const logoPath = `${company.id}/logo.svg`;
    await admin.storage.from("logos").upload(logoPath, makeLogo(name, color), { contentType: "image/svg+xml", upsert: true });
    await admin.from("companies").update({ logo_path: logoPath }).eq("id", company.id);

    if (status !== "registrada") await admin.from("companies").update({ status: "en_revision" }).eq("id", company.id);
    if (["autorizada", "rechazada", "suspendida"].includes(status)) {
      await admin
        .from("companies")
        .update({
          status: status === "suspendida" ? "autorizada" : status,
          review_note: status === "rechazada" ? "No fue posible verificar la existencia de la organización en el RUES." : null,
          authorized_at: status === "rechazada" ? null : daysAgo(15),
          authorized_until: status === "rechazada" ? null : dateIn(350),
        })
        .eq("id", company.id);
    }
    if (status === "suspendida") await admin.from("companies").update({ status: "suspendida", review_note: "Uso indebido de los datos exportados (caso de demostración)." }).eq("id", company.id);
    created.push({ id: company.id, userId, name, status });
  }
  console.log(`${created.length} empresas`);

  const listed = students.filter((s) => ["disponible", "en_proceso"].includes(s.availability));
  for (const c of created.filter((c) => ["autorizada", "registrada", "en_revision"].includes(c.status))) {
    const favs = sample(listed, c.status === "autorizada" ? 5 : 2);
    await admin.from("favorites").insert(favs.map((s) => ({ company_id: c.id, student_id: s.id })));
    if (c.status === "autorizada") {
      await admin.from("contact_events").insert(
        favs.slice(0, 4).flatMap((s, k) => [
          { company_id: c.id, user_id: c.userId, student_id: s.id, kind: "view_contact", created_at: daysAgo(k + 1) },
          ...(k % 2 === 0 ? [{ company_id: c.id, user_id: c.userId, student_id: s.id, kind: "download_cv", created_at: daysAgo(k + 1) }] : []),
        ])
      );
      await admin.from("exports_log").insert([
        { company_id: c.id, user_id: c.userId, filters: { skill_ids: [] }, row_count: 8 + Math.floor(rand() * 6), created_at: daysAgo(3) },
      ]);
    }
  }
  console.log("Favoritos, consultas y exportaciones de demostración listos");
  return created;
}

if (process.argv.includes("--passwords")) {
  if (!process.env.DEMO_PASSWORD) {
    console.error("Falta DEMO_PASSWORD en .env.local");
    process.exit(1);
  }
  const users = (await listAllUsers()).filter((u) => /^demo\./.test(u.email ?? ""));
  for (const u of users) await admin.auth.admin.updateUserById(u.id, { password: process.env.DEMO_PASSWORD });
  console.log(`Contraseña de demostración aplicada a ${users.length} cuentas`);
  process.exit(0);
}

const removed = await clean();
console.log(`Demo anterior borrada: ${removed.users} cuentas, ${removed.companies} empresas`);
if (!process.argv.includes("--clean")) {
  const students = await seedStudents();
  await seedCompanies(students);
  console.log(process.env.DEMO_PASSWORD ? "Cuentas de demostración con DEMO_PASSWORD" : "Cuentas de demostración con contraseña aleatoria (agregue DEMO_PASSWORD para poder entrar)");
}
