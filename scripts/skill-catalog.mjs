// Loads the description and icon of every catalog skill. Icons are Tabler Icons (MIT, https://tabler.io/icons),
// recolored to the UNAL blue and stored in the public bucket skill-icons; a copy stays in scripts/skill-icons/.
// Run: node --env-file=.env.local scripts/skill-catalog.mjs   (only fills skills that have no icon or description)
import { mkdir, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const TABLER = "https://unpkg.com/@tabler/icons@3.24.0/icons/outline";
const COLOR = "#13477C";

// [skill name, icon candidates (first one that exists wins), description]
const CATALOG = [
  ["Diseño de experimentos", ["flask"], "Planear experimentos y ensayos para obtener conclusiones válidas con el menor número de pruebas."],
  ["Muestreo y encuestas", ["clipboard-list"], "Diseñar muestras y cuestionarios, recoger datos en campo y estimar resultados para toda una población."],
  ["Modelos de regresión", ["chart-line"], "Explicar y predecir una variable a partir de otras con modelos lineales, logísticos y generalizados."],
  ["Series de tiempo", ["timeline", "chart-area-line"], "Analizar datos que cambian en el tiempo para detectar tendencias, estacionalidad y hacer pronósticos."],
  ["Estadística bayesiana", ["chart-dots-2", "chart-dots"], "Actualizar estimaciones con evidencia nueva y cuantificar la incertidumbre con modelos bayesianos."],
  ["Análisis multivariado", ["chart-scatter-3d", "chart-scatter"], "Estudiar muchas variables a la vez: componentes principales, conglomerados y análisis factorial."],
  ["Aprendizaje estadístico", ["chart-dots-3"], "Construir y validar modelos predictivos como árboles, bosques aleatorios y máquinas de soporte vectorial."],
  ["Control estadístico de la calidad", ["chart-arrows-vertical", "adjustments-check"], "Vigilar procesos productivos con gráficos de control y estudios de capacidad para reducir defectos."],
  ["Bioestadística", ["heartbeat"], "Aplicar la estadística a la salud y la biología: ensayos clínicos, epidemiología y supervivencia."],
  ["Econometría", ["chart-candle"], "Modelar fenómenos económicos y financieros con datos para estimar efectos y evaluar políticas."],
  ["Visualización de datos", ["chart-pie"], "Convertir datos en gráficos y tableros claros que ayuden a entender un problema y tomar decisiones."],
  ["Ciencia de datos", ["database-search", "database"], "Recorrer todo el ciclo de los datos: limpiarlos, explorarlos, modelarlos y comunicar los resultados."],
  ["Algoritmos y estructuras de datos", ["binary-tree"], "Diseñar soluciones eficientes y elegir las estructuras de datos adecuadas para cada problema."],
  ["Desarrollo de software", ["code"], "Construir, probar y mantener aplicaciones con buenas prácticas de programación y trabajo en equipo."],
  ["Desarrollo web", ["world-www"], "Crear sitios y aplicaciones web, desde la interfaz hasta el servidor."],
  ["Bases de datos", ["database"], "Diseñar, consultar y administrar bases de datos relacionales y no relacionales."],
  ["Criptografía", ["key"], "Proteger la información con cifrado, firmas digitales y protocolos basados en matemáticas."],
  ["Seguridad informática", ["shield-lock"], "Identificar vulnerabilidades y proteger sistemas, redes y datos frente a ataques."],
  ["Inteligencia artificial", ["robot"], "Diseñar sistemas que razonan, planifican o resuelven problemas de forma autónoma."],
  ["Aprendizaje automático", ["brain"], "Entrenar modelos que aprenden de los datos, incluidas las redes neuronales y el aprendizaje profundo."],
  ["Computación científica", ["cpu"], "Resolver problemas de ciencia e ingeniería con algoritmos numéricos y cómputo de alto rendimiento."],
  ["Modelamiento computacional", ["topology-star-3", "topology-ring"], "Representar sistemas reales en el computador para simularlos y estudiar su comportamiento."],
  ["Computación en la nube", ["cloud-computing", "cloud"], "Desplegar y operar servicios en plataformas en la nube como AWS, Azure o Google Cloud."],
  ["Modelación matemática", ["math-function"], "Traducir un problema real a ecuaciones o modelos matemáticos para analizarlo y resolverlo."],
  ["Análisis numérico", ["math-integral", "math"], "Aproximar soluciones de problemas matemáticos con métodos numéricos y controlar su error."],
  ["Optimización", ["adjustments"], "Encontrar la mejor decisión posible bajo restricciones: programación lineal, entera y no lineal."],
  ["Investigación de operaciones", ["route"], "Mejorar la logística, la producción y la asignación de recursos con modelos cuantitativos."],
  ["Ecuaciones diferenciales", ["wave-sine"], "Describir y resolver fenómenos que cambian continuamente, de la física a la biología."],
  ["Probabilidad", ["dice-5"], "Cuantificar la incertidumbre y modelar fenómenos aleatorios con distribuciones y procesos estocásticos."],
  ["Matemática financiera", ["coins"], "Valorar inversiones, créditos y flujos de dinero en el tiempo."],
  ["Actuaría", ["umbrella"], "Medir y gestionar riesgos en seguros, pensiones y finanzas con modelos matemáticos y estadísticos."],
  ["Instrumentación y metrología", ["ruler-measure"], "Medir con exactitud, calibrar equipos y estimar la incertidumbre de las mediciones."],
  ["Sensores", ["radar"], "Seleccionar, integrar y calibrar sensores para medir variables físicas, químicas o ambientales."],
  ["Electrónica", ["circuit-resistor", "cpu-2"], "Diseñar y montar circuitos analógicos y digitales para medición y control."],
  ["Ciencia de materiales", ["cube"], "Relacionar la estructura de los materiales con sus propiedades para elegirlos o desarrollar nuevos."],
  ["Caracterización de materiales", ["microscope"], "Analizar materiales con técnicas como difracción de rayos X, microscopía y espectroscopía."],
  ["Óptica y optoelectrónica", ["prism", "bulb"], "Trabajar con luz, láseres, fibras ópticas y dispositivos que la emiten o la detectan."],
  ["Magnetismo", ["magnet"], "Estudiar y aplicar las propiedades magnéticas de los materiales y los dispositivos que las usan."],
  ["Física del plasma", ["flame"], "Generar y estudiar gases ionizados, con aplicaciones en recubrimientos, superficies y energía."],
  ["Biofísica", ["heart-rate-monitor"], "Aplicar métodos de la física para entender procesos biológicos y señales del cuerpo."],
  ["Simulación de sistemas físicos", ["atom"], "Simular sistemas físicos en el computador, de la dinámica molecular a los elementos finitos."],
  ["Nanotecnología", ["hexagons", "hexagon"], "Diseñar y usar materiales y dispositivos a escala nanométrica."],
  ["Energía solar", ["solar-panel"], "Aprovechar la radiación solar con celdas fotovoltaicas y sistemas térmicos."],
  ["Biología molecular", ["dna"], "Trabajar con ADN, ARN y proteínas: extracción, PCR, clonación y secuenciación."],
  ["Microbiología", ["virus"], "Aislar, cultivar e identificar microorganismos y estudiar su papel en la salud, la industria y el ambiente."],
  ["Cultivos in vitro", ["plant"], "Cultivar células y tejidos vegetales o animales en condiciones controladas de laboratorio."],
  ["Biorreactores", ["flask-2"], "Operar y escalar biorreactores para producir biomasa, enzimas u otros productos."],
  ["Bioprocesos", ["building-factory"], "Diseñar procesos que usan organismos o enzimas para obtener productos de valor."],
  ["Biotecnología", ["leaf"], "Aplicar organismos vivos y sus componentes en la salud, el agro, la industria y el ambiente."],
  ["Bioinformática", ["dna-2"], "Analizar secuencias y datos biológicos con herramientas computacionales."],
  ["Buenas prácticas de laboratorio", ["test-pipe"], "Trabajar en el laboratorio con seguridad, trazabilidad y calidad según las normas BPL."],
  ["Buenas prácticas de manufactura", ["building-factory-2"], "Producir con calidad y seguridad según las normas BPM de la industria farmacéutica y de alimentos."],
  ["Python", ["brand-python"], "Programar en Python para análisis de datos, automatización, cálculo científico y aprendizaje automático."],
  ["R", ["letter-r"], "Analizar datos y hacer estadística en R, incluidos sus paquetes y reportes reproducibles."],
  ["SQL", ["sql"], "Consultar y transformar datos en bases relacionales con SQL."],
  ["Java", ["coffee"], "Programar aplicaciones y servicios en Java."],
  ["C y C++", ["brand-cpp"], "Programar en C y C++ para software de alto rendimiento, sistemas embebidos y cálculo."],
  ["JavaScript y TypeScript", ["brand-javascript", "brand-typescript"], "Programar interfaces y servicios web con JavaScript y TypeScript."],
  ["MATLAB u Octave", ["matrix"], "Hacer cálculo numérico, simulación y procesamiento de señales en MATLAB u Octave."],
  ["SageMath", ["infinity"], "Hacer cálculo simbólico y matemática computacional con SageMath."],
  ["LaTeX", ["math-symbols", "typography"], "Escribir documentos científicos, artículos y presentaciones con LaTeX."],
  ["Excel avanzado", ["table"], "Usar Excel con fórmulas avanzadas, tablas dinámicas, macros y modelos de cálculo."],
  ["Power BI", ["chart-bar"], "Construir tableros e informes interactivos con Power BI."],
  ["Tableau", ["chart-histogram"], "Crear visualizaciones y tableros interactivos con Tableau."],
  ["SAS", ["chart-infographic"], "Analizar datos y hacer estadística con SAS."],
  ["SPSS", ["chart-arcs", "chart-donut"], "Hacer análisis estadístico con SPSS."],
  ["Stata", ["chart-area"], "Analizar datos estadísticos y econométricos con Stata."],
  ["Git", ["brand-git"], "Versionar código y colaborar en proyectos con Git y plataformas como GitHub o GitLab."],
  ["Linux", ["terminal-2"], "Trabajar en sistemas Linux desde la terminal y automatizar tareas con scripts."],
  ["Docker", ["brand-docker"], "Empaquetar y desplegar aplicaciones en contenedores con Docker."],
  ["LabVIEW", ["gauge"], "Programar adquisición de datos, instrumentación y control con LabVIEW."],
  ["Arduino", ["device-desktop-analytics", "cpu"], "Prototipar sistemas de medición y control con placas Arduino."],
  ["Raspberry Pi", ["brand-raspberry-pi", "device-desktop"], "Construir prototipos y sistemas embebidos con Raspberry Pi."],
  ["COMSOL", ["box-multiple"], "Simular fenómenos físicos acoplados por elementos finitos con COMSOL Multiphysics."],
  ["CAD", ["ruler-2"], "Diseñar piezas, planos y modelos 3D con herramientas de dibujo asistido por computador."],
  ["Docencia", ["school"], "Preparar y orientar clases, talleres y cursos para distintos públicos."],
  ["Tutoría académica", ["users"], "Acompañar a estudiantes en su aprendizaje con asesorías individuales o grupales."],
  ["Divulgación científica", ["speakerphone"], "Comunicar la ciencia de forma clara y atractiva al público general."],
  ["Diseño de material educativo", ["presentation"], "Crear guías, presentaciones, videos y recursos didácticos."],
];

const db = createClient("https://iwpnsyuvqvmdlsbkbzly.supabase.co", process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const { data: skills, error } = await db.from("skills").select("id, name, icon_path, description");
if (error) throw error;
await mkdir(new URL("./skill-icons/", import.meta.url), { recursive: true });

const used = new Map();
for (const [name, candidates, description] of CATALOG) {
  const skill = skills.find((s) => s.name === name);
  if (!skill) {
    console.log(`  falta en la base: ${name}`);
    continue;
  }
  const patch = {};
  if (!skill.description) patch.description = description;
  if (!skill.icon_path) {
    let svg = null;
    let icon = null;
    for (const c of candidates) {
      const res = await fetch(`${TABLER}/${c}.svg`);
      if (res.ok) {
        svg = (await res.text()).replaceAll("currentColor", COLOR);
        icon = c;
        break;
      }
    }
    if (!svg) {
      console.log(`  sin ícono: ${name} (${candidates.join(", ")})`);
    } else {
      if (used.has(icon)) console.log(`  ícono repetido: ${icon} en ${name} y ${used.get(icon)}`);
      used.set(icon, name);
      const path = `${skill.id}-${icon}.svg`;
      await writeFile(new URL(`./skill-icons/${path}`, import.meta.url), svg);
      const up = await db.storage.from("skill-icons").upload(path, new Blob([svg], { type: "image/svg+xml" }), { contentType: "image/svg+xml", upsert: true });
      if (up.error) throw up.error;
      patch.icon_path = path;
    }
  }
  if (Object.keys(patch).length) {
    const { error: e } = await db.from("skills").update(patch).eq("id", skill.id);
    if (e) throw e;
  }
}
const { count } = await db.from("skills").select("id", { count: "exact", head: true }).not("icon_path", "is", null).not("description", "is", null);
console.log(`Habilidades con ícono y descripción: ${count} de ${skills.length}`);
