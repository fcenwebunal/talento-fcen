// Demo data for the beta: fictional students, companies, photos, logos, CVs and activity.
// Run: node --env-file=.env.local scripts/demo-seed.mjs          (replaces previous demo data)
//      node --env-file=.env.local scripts/demo-seed.mjs --clean  (only removes demo data)
//      node --env-file=.env.local scripts/demo-seed.mjs --passwords  (sets DEMO_PASSWORD on every demo account)
// Demo accounts use DEMO_PASSWORD from .env.local when present; otherwise a random password (they cannot log in).
// Everything demo is marked: emails end in .demo@ (they never match a real account) and company ids are
// listed in app_settings.demo_company_ids. Faces in demo-assets/rostros are AI-generated (no real people).
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
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

const SOFT = ["Trabajo en equipo", "Comunicación oral y escrita", "Pensamiento analítico y resolución de problemas", "Liderazgo", "Adaptabilidad y aprendizaje autónomo", "Organización y manejo del tiempo", "Creatividad e innovación", "Orientación a resultados"];
const CITIES = ["Manizales", "Manizales", "Manizales", "Villamaría", "Chinchiná", "Pereira", "Armenia"];

const STUDENTS = [
  ["Valentina Ríos Arango", "estadistica", "disponible", 6, 88],
  ["Santiago Herrera Gil", "ciencias-computacion", "disponible", 12, 82],
  ["Mariana Ocampo López", "ingenieria-fisica", "disponible", 3, 90],
  ["Juan Esteban Cardona Ruiz", "matematicas", "disponible", 40, 79],
  ["Laura Sofía Giraldo Mejía", "ingenieria-biologica", "disponible", 20, 74],
  ["Andrés Felipe Salazar Ortiz", "ciencias-computacion", "en_proceso", 15, 85],
  ["Daniela Marín Restrepo", "estadistica", "disponible", 82, 81],
  ["Camilo Andrés Duque Arias", "ingenieria-fisica", "en_practica", 60, 93],
  ["Isabella Castaño Mejía", "matematicas", "disponible", 9, 76],
  ["Mateo Zuluaga Henao", "ciencias-computacion", "disponible", 25, 71],
  ["Sara Valencia Montoya", "ingenieria-biologica", "en_proceso", 30, 80],
  ["Tomás Escobar Ramírez", "estadistica", "sin_confirmar", 110, 77],
  ["Natalia Franco Osorio", "ciencias-computacion", "no_disponible", 140, 68],
  ["Sebastián Arias Quintero", "ingenieria-fisica", "disponible", 50, 84],
  ["Manuela Gómez Patiño", "matematicas", "disponible", 2, 86],
  ["Felipe Londoño Vargas", "estadistica", "disponible", 18, 80],
  ["Carolina Betancur Ruiz", "matematicas", "disponible", 7, 76],
  ["Alejandro Rendón Toro", "matematicas", "disponible", 33, 82],
  ["Juliana Agudelo Correa", "ingenieria-fisica", "en_proceso", 45, 79],
  ["David Soto Hincapié", "ingenieria-fisica", "disponible", 14, 74],
  ["Paula Andrea Montes Cano", "estadistica", "disponible", 70, 88],
  ["Nicolás Bedoya Arenas", "ciencias-computacion", "disponible", 5, 90],
];

const FACES = {
  "Valentina Ríos Arango": 3, "Santiago Herrera Gil": 19, "Mariana Ocampo López": 9, "Juan Esteban Cardona Ruiz": 8,
  "Laura Sofía Giraldo Mejía": 15, "Andrés Felipe Salazar Ortiz": 20, "Daniela Marín Restrepo": 30, "Camilo Andrés Duque Arias": 26,
  "Isabella Castaño Mejía": 11, "Mateo Zuluaga Henao": 22, "Sara Valencia Montoya": 21, "Tomás Escobar Ramírez": 4,
  "Natalia Franco Osorio": 28, "Manuela Gómez Patiño": 5, "Felipe Londoño Vargas": 10, "Carolina Betancur Ruiz": 17,
  "Alejandro Rendón Toro": 14, "Juliana Agudelo Correa": 24, "Paula Andrea Montes Cano": 2,
};

const ABOUT_EXTRA = [
  "En el semillero aprendí a documentar bien lo que hago y a presentar resultados con claridad.",
  "Me motiva trabajar con datos reales y ver el impacto de un análisis en una decisión concreta.",
  "He liderado trabajos en equipo de la carrera y me adapto rápido a herramientas nuevas.",
  "Busco un entorno donde pueda aprender de personas con experiencia y aportar desde el primer mes.",
  "Disfruto explicar temas técnicos a personas de otras áreas.",
];

// UNAL style: two letters of the first name, first surname, three letters of the second surname, plus .demo.
function unalEmail(name) {
  const w = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/\s+/);
  const [s1, s2] = w.length >= 4 ? [w[w.length - 2], w[w.length - 1]] : [w[1], w[2]];
  return `${w[0].slice(0, 2)}${s1}${s2.slice(0, 3)}.demo@unal.edu.co`;
}

const COMPANIES = [
  { name: "Analítica Cafetera S.A.S.", sector: "Consultoría en analítica de datos", size: "pequena", city: "Manizales", status: "autorizada", color: "#13477c", emblem: "chart", domain: "analiticacafetera.co", contact: "Lina María Arcila", position: "Líder de talento humano", nit: "901457823-4" },
  { name: "Torre Norte Software S.A.S.", sector: "Desarrollo de software", size: "mediana", city: "Manizales", status: "autorizada", color: "#0b2e59", emblem: "code", domain: "torrenortesoftware.co", contact: "Julián Andrés Osorio", position: "Director de ingeniería", nit: "900874521-7" },
  { name: "BioAndes Laboratorios S.A.S.", sector: "Biotecnología agrícola", size: "mediana", city: "Chinchiná", status: "autorizada", color: "#3f6a00", emblem: "leaf", domain: "bioandeslab.co", contact: "Marcela Hoyos Valencia", position: "Coordinadora de I+D", nit: "901236598-1" },
  { name: "Metrocal Caldas S.A.S.", sector: "Calibración y metrología industrial", size: "pequena", city: "Manizales", status: "en_revision", color: "#8a5d00", emblem: "gauge", domain: "metrocalcaldas.co", contact: "Héctor Fabio Ramírez", position: "Gerente técnico", nit: "900563214-9" },
  { name: "Seguros La Cumbre S.A.", sector: "Seguros y actuaría", size: "grande", city: "Pereira", status: "en_revision", color: "#0c6896", emblem: "shield", domain: "seguroslacumbre.co", contact: "Catalina Mejía Duque", position: "Jefa de actuaría", nit: "860512347-3" },
  { name: "Nevado Energía Solar S.A.S.", sector: "Energía solar", size: "pequena", city: "Villamaría", status: "registrada", color: "#c1390a", emblem: "sun", domain: "nevadoenergia.co", contact: "Óscar Iván Cardona", position: "Gerente general", nit: "901785412-6" },
  { name: "Hidrolab Ambiental S.A.S.", sector: "Laboratorio de análisis ambiental", size: "pequena", city: "Manizales", status: "registrada", color: "#3fa3c9", emblem: "drop", domain: "hidrolabambiental.co", contact: "Paola Andrea Gallego", position: "Directora de laboratorio", nit: "900987456-2" },
  { name: "Impulso Digital Mercadeo S.A.S.", sector: "Mercadeo digital", size: "micro", city: "Bogotá", status: "rechazada", color: "#4b2a7b", emblem: "megaphone", domain: "impulsodigital.co", contact: "Andrés Mauricio Pinto", position: "Gerente", nit: "901112233-0" },
  { name: "Inversiones Altos del Cable S.A.S.", sector: "Finanzas e inversiones", size: "pequena", city: "Manizales", status: "suspendida", color: "#5f6b7a", emblem: "trend", domain: "altosdelcable.co", contact: "Ricardo León Salazar", position: "Representante legal", nit: "900445566-8" },
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

function facePhoto(name) {
  const n = FACES[name];
  return n ? readFileSync(new URL(`./demo-assets/rostros/rostro-${String(n).padStart(2, "0")}.webp`, import.meta.url)) : null;
}


const EMBLEMS = {
  chart: '<rect x="62" y="104" width="18" height="34" rx="3"/><rect x="91" y="84" width="18" height="54" rx="3"/><rect x="120" y="62" width="18" height="76" rx="3"/>',
  code: '<path d="M84 72 58 100l26 28M116 72l26 28-26 28" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>',
  leaf: '<path d="M60 136c0-50 30-76 82-78-2 52-28 80-78 80l-4-2z"/><path d="M68 132 118 82" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>',
  gauge: '<path d="M54 124a46 46 0 0 1 92 0" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/><path d="M100 124 124 92" stroke="#fff" stroke-width="9" stroke-linecap="round"/><circle cx="100" cy="124" r="9"/>',
  shield: '<path d="M100 56 142 72v30c0 26-18 42-42 50-24-8-42-24-42-50V72z"/><path d="m82 102 12 12 24-26" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>',
  sun: '<circle cx="100" cy="100" r="22"/><g stroke="#fff" stroke-width="8" stroke-linecap="round"><path d="M100 56v12M100 132v12M56 100h12M132 100h12M69 69l8 8M123 123l8 8M131 69l-8 8M77 123l-8 8"/></g>',
  drop: '<path d="M100 54c20 28 34 46 34 64a34 34 0 0 1-68 0c0-18 14-36 34-64z"/>',
  megaphone: '<path d="M58 92h22l50-26v68l-50-26H58z"/><path d="M76 118l8 22" stroke="#fff" stroke-width="9" stroke-linecap="round"/>',
  trend: '<path d="M56 130l30-30 20 18 38-44" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M124 74h20v20" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>',
};

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

// Raster logos (PNG) so the demo also exercises image storage.
async function makeLogo(company) {
  const words = company.name.replace(/ S\.A\.S\.| S\.A\.| S\.A\.S\. E\.S\.P\./g, "").split(" ");
  const line1 = words[0];
  const line2 = words.slice(1).join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" color="${company.color}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(company.color, 0.12)}"/><stop offset="1" stop-color="${shade(company.color, -0.12)}"/></linearGradient>
      <radialGradient id="glow" cx="0.75" cy="0.2" r="0.7"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
      <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.28"/></filter>
    </defs>
    <rect width="512" height="512" rx="112" fill="url(#bg)"/>
    <rect width="512" height="512" rx="112" fill="url(#glow)"/>
    <path d="M0 380 C 140 320, 300 440, 512 360 L512 512 L0 512 Z" fill="#000" opacity="0.12"/>
    <g transform="translate(76 0) scale(1.8)" filter="url(#sh)" fill="#fff">${EMBLEMS[company.emblem]}</g>
    <text x="256" y="372" font-family="Arial Black, Arial, sans-serif" font-size="${line1.length > 10 ? 50 : 58}" font-weight="900" text-anchor="middle" fill="#fff">${line1}</text>
    <text x="256" y="424" font-family="Arial, sans-serif" font-size="${line2.length > 16 ? 30 : 36}" text-anchor="middle" fill="#fff" opacity="0.88">${line2}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
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

const isDemoEmail = (email = "") => /[.+]demo@|^demo\./.test(email);

async function demoCompanyIds() {
  const { data: setting } = await admin.from("app_settings").select("value").eq("key", "demo_company_ids").maybeSingle();
  const { data: legacy } = await admin.from("companies").select("id").like("nit", "DEMO-%");
  return [...new Set([...(setting?.value ?? []), ...(legacy ?? []).map((c) => c.id)])];
}

async function clean() {
  const companies = (await demoCompanyIds()).map((id) => ({ id }));
  for (const c of companies ?? []) {
    const { data: files } = await admin.storage.from("logos").list(c.id);
    if (files?.length) await admin.storage.from("logos").remove(files.map((f) => `${c.id}/${f.name}`));
  }
  if (companies?.length) await admin.from("companies").delete().in("id", companies.map((c) => c.id));
  const users = (await listAllUsers()).filter((u) => isDemoEmail(u.email));
  for (const u of users) {
    const { data: avatars } = await admin.storage.from("avatars").list(u.id);
    if (avatars?.length) await admin.storage.from("avatars").remove(avatars.map((f) => `${u.id}/${f.name}`));
    for (const kind of ["foto", "hoja_vida", "historia_academica", "certificado"]) {
      const { data: files } = await admin.storage.from("documentos").list(`${u.id}/${kind}`);
      if (files?.length) await admin.storage.from("documentos").remove(files.map((f) => `${u.id}/${kind}/${f.name}`));
    }
    await admin.auth.admin.deleteUser(u.id);
  }
  await admin.from("app_settings").delete().eq("key", "demo_company_ids");
  return { companies: companies.length, users: users.length };
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
    const email = unalEmail(name);
    const id = await createAccount(email, name);
    ids.push({ id, name, prog, availability });
    await admin.from("profiles").update({ role: "student", full_name: name }).eq("id", id);
    await admin.from("students").upsert({ id });
    await admin.from("student_private").upsert({ student_id: id });
    const face = facePhoto(name);
    if (face) {
      const avatarPath = `${id}/avatar.webp`;
      await admin.storage.from("avatars").upload(avatarPath, face, { contentType: "image/webp", upsert: true });
      await admin.from("profiles").update({ avatar_path: avatarPath }).eq("id", id);
    }

    const first = email.split(".demo@")[0];
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
      about: `${content.about} ${ABOUT_EXTRA[i % ABOUT_EXTRA.length]}`,
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
      linkedin_url: `https://www.linkedin.com/in/${slug(name).replace(/\./g, "-")}`,
      github_url: ["ciencias-computacion", "estadistica"].includes(prog) ? `https://github.com/${first}` : null,
      portfolio_url: i % 4 === 2 ? `https://${first}.github.io` : null,
      consent_anonymous: availability !== "no_disponible",
      consent_contact: consentContact,
      consent_version: "2026-10-31",
      consent_at: daysAgo(confirmedDaysAgo),
      truthful_declared: true,
    });
    await admin.from("student_private").upsert({
      student_id: id,
      doc_type: "Cédula de ciudadanía",
      doc_number: String(1053800000 + i * 7919),
      birth_date: `${2000 + (i % 5)}-0${1 + (i % 9)}-1${i % 9}`,
      phone: `3${pick(["00", "01", "10", "13", "14", "20", "22"])} ${String(400 + i * 37).padStart(3, "0")} ${String(1000 + i * 263).slice(-4)}`,
      personal_email: `${first}.demo@gmail.com`,
      eps: pick(["Salud Total", "Sura", "Nueva EPS", "Sanitas", "Coosalud"]),
      emergency_name: pick(["Gloria Inés", "Luz Marina", "Jorge Alberto", "Carlos Arturo", "Martha Lucía"]) + " " + name.split(" ").slice(-2, -1)[0],
      emergency_relation: pick(["Madre", "Padre", "Hermana", "Tío"]),
      emergency_phone: `310 000 ${String(2000 + i).padStart(4, "0")}`,
    });

    const chosen = sample(content.skills.filter((s) => skillId[s]), 5 + Math.floor(rand() * 5));
    await admin.from("student_skills").insert(
      chosen.map((s, k) => ({
        student_id: id,
        skill_id: skillId[s],
        level: k < 2 ? 3 : k < 5 ? 2 : 1,
        evidence_url: k === 0 ? `https://github.com/${first}/portafolio` : null,
      }))
    );
    await admin.from("student_soft_skills").insert(sample(SOFT, 3 + Math.floor(rand() * 3)).map((s) => ({ student_id: id, soft_skill_id: softId[s] })));
    await admin.from("student_areas").insert(sample(content.areas, 2 + Math.floor(rand() * 2)).map((a) => ({ student_id: id, area_id: areaId[a] })));
    await admin.from("student_languages").insert([
      { student_id: id, language: "Inglés", level: pick(["A2", "B1", "B1", "B2", "C1"]), certificate: i % 3 === 0 ? "Sí, examen internacional" : "No" },
      ...(i % 4 === 0 ? [{ student_id: id, language: pick(["Francés", "Portugués", "Alemán"]), level: "A2", certificate: "No" }] : []),
    ]);
    await admin.from("relevant_subjects").insert(sample(content.subjects, 2 + Math.floor(rand() * 3)).map(([n, r]) => ({ student_id: id, name: n, reason: r })));
    await admin.from("projects").insert(sample(content.projects, 1 + Math.floor(rand() * 3)).map(([t, d], k) => ({ student_id: id, title: t, description: d, year: 2025 + (k % 2), url: k === 0 ? `https://github.com/${first}/${slug(t).split(".").slice(0, 3).join("-")}` : null })));
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
      ["p", email],
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
      ...(facePhoto(name) ? [["foto", `foto-${slug(name)}.webp`, facePhoto(name), "image/webp"]] : []),
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
  for (const [i, c] of COMPANIES.entries()) {
    const { name, sector, size, city, status } = c;
    const email = `seleccion.demo@${c.domain}`;
    const userId = await createAccount(email, c.contact);
    const { data: company, error } = await admin
      .from("companies")
      .insert({
        nit: c.nit,
        name,
        sector,
        size,
        city,
        website: `https://www.${c.domain}`,
        description: `${name} trabaja en ${sector.toLowerCase()} desde ${city}. Buscamos practicantes de la FCEN para proyectos reales con acompañamiento de un tutor del equipo.`,
        terms_version: "2026-10-31",
        terms_accepted_at: daysAgo(20 - i),
      })
      .select("id")
      .single();
    if (error) throw error;
    await admin.from("company_members").insert({ user_id: userId, company_id: company.id, member_role: "owner", contact_name: c.contact, position: c.position, phone: `606 ${String(8800000 + i * 12345).slice(0, 3)} ${String(1000 + i * 77).slice(-4)}` });
    const logoPath = `${company.id}/logo.png`;
    await admin.storage.from("logos").upload(logoPath, await makeLogo(c), { contentType: "image/png", upsert: true });
    await admin.from("companies").update({ logo_path: logoPath }).eq("id", company.id);

    if (status !== "registrada") await admin.from("companies").update({ status: "en_revision" }).eq("id", company.id);
    if (["autorizada", "rechazada", "suspendida"].includes(status)) {
      await admin
        .from("companies")
        .update({
          status: status === "suspendida" ? "autorizada" : status,
          review_note: status === "rechazada" ? "No fue posible verificar la existencia de la organización en el RUES con el NIT registrado." : null,
          authorized_at: status === "rechazada" ? null : daysAgo(15),
          authorized_until: status === "rechazada" ? null : dateIn(350),
        })
        .eq("id", company.id);
    }
    if (status === "suspendida") await admin.from("companies").update({ status: "suspendida", review_note: "Se reportó el uso de los datos exportados para fines distintos a la selección de practicantes." }).eq("id", company.id);
    created.push({ id: company.id, userId, name, status });
  }
  await admin.from("app_settings").upsert({ key: "demo_company_ids", value: created.map((c) => c.id), description: "Empresas de demostración (se borran con npm run demo:clean)" });
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
  const users = (await listAllUsers()).filter((u) => isDemoEmail(u.email));
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
