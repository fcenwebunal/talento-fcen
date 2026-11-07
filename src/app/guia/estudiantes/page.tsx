import type { Metadata } from "next";
import Link from "next/link";
import { Faq, GuideSection, Pending, Timeline, Toc } from "@/components/guide";
import { PageHeader } from "@/components/ui/page-header";
import { CvToOrg, PuzzleMatch } from "@/components/ui/connect-art";
import { Building2, GraduationCap } from "lucide-react";
import { DateCalculator, FlipCards, ProgramPicker, ReadinessChecker } from "./interactive";

export const metadata: Metadata = { title: "Guía del estudiante" };

const TOC = [
  { id: "que-es", label: "¿Qué es una práctica?" },
  { id: "mi-carrera", label: "¿Cómo encaja en mi carrera?" },
  { id: "listo", label: "¿Estoy listo?" },
  { id: "cuando", label: "¿Cuándo empiezo a buscar?" },
  { id: "ruta", label: "La ruta en 7 pasos" },
  { id: "vinculacion", label: "Formas de vinculación" },
  { id: "derechos", label: "Derechos y deberes" },
  { id: "pago", label: "¿Me pagan?" },
  { id: "destacar", label: "Cómo destacar tu perfil" },
  { id: "datos", label: "¿Quién ve mis datos?" },
  { id: "preguntas", label: "Preguntas frecuentes" },
  { id: "glosario", label: "Glosario" },
];

export default function StudentGuide() {
  return (
    <>
      <PageHeader
        kicker="Guía del estudiante"
        icon={GraduationCap}
        title="Tu práctica empieza aquí"
        description="Qué es una práctica, si estás listo y la ruta paso a paso hasta formalizarla con la Facultad."
        art={<CvToOrg className="w-52" />}
      >
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["#que-es", "Qué es una práctica"],
            ["#listo", "¿Estoy listo?"],
            ["#ruta", "La ruta en 7 pasos"],
            ["#preguntas", "Preguntas frecuentes"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="chip chip-azul">
              {label}
            </a>
          ))}
        </div>
      </PageHeader>

      <div className="wrap grid gap-10 lg:grid-cols-[14rem_1fr]">
        <aside className="hidden lg:block">
          <Toc items={TOC} />
        </aside>
        <div className="min-w-0 max-w-3xl divide-y divide-dashed divide-borde">
          <GuideSection id="que-es" kicker="Lo básico" title="¿Qué es una práctica?">
            <p>
              Una práctica es una actividad que haces <strong>bajo la orientación de un profesor</strong> para ganar destrezas, conocer cómo
              se trabaja en tu campo y aplicar lo que aprendiste en la carrera. La Universidad reconoce tres grandes tipos (Acuerdo 011 de
              2011 del Consejo Superior Universitario):
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["Académica", "Ligada a tu plan de estudios, en empresas u organizaciones, para conocer sus procesos.", "Analizar datos de calidad en una planta de alimentos"],
                ["De investigación y creación", "Dentro de un proyecto de investigación.", "Apoyar un proyecto de un grupo de la Facultad"],
                ["De extensión", "Llevar el conocimiento de la Universidad a una organización o a la sociedad.", "Una pasantía en una entidad pública o una empresa de tecnología"],
              ].map(([t, d, e]) => (
                <div key={t} className="card card-hover">
                  <p className="font-black text-azul-oscuro">{t}</p>
                  <p className="mt-1 text-sm">{d}</p>
                  <p className="mt-2 text-xs text-suave">Ejemplo: {e}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              <strong>Una práctica no es un empleo.</strong> En una práctica formativa no hay relación laboral; lo que haces debe
              corresponder a tu formación y a un plan acordado. Si la organización te vincula con un contrato, ese contrato tiene sus propias
              reglas.
            </p>
            <FlipCards
              items={[
                { myth: "La práctica es trabajar gratis.", fact: "Es formación con un plan de actividades, un tutor en la organización y un profesor que te acompaña." },
                { myth: "La Facultad me consigue la empresa.", fact: "La búsqueda es tuya, pero aquí las empresas pueden encontrarte por tus habilidades." },
                { myth: "Puedo empezar y formalizar después.", fact: "Si hace falta un convenio, debe estar firmado antes de empezar." },
              ]}
            />
          </GuideSection>

          <GuideSection id="mi-carrera" kicker="Tu programa" title="¿Cómo encaja la práctica en mi carrera?">
            <p>
              En los planes de estudio de la FCEN, la práctica en una organización se hace a través de la asignatura{" "}
              <strong>Trabajo de Grado</strong>, en su modalidad de pasantía o práctica de extensión. El Acuerdo 026 de 2012 del Consejo
              Académico reglamenta esa asignatura y sus modalidades, y cada facultad define cuáles aplica.
            </p>
            <p className="mt-2">
              <Pending>Norma vigente de trabajo de grado de la FCEN y modalidades admitidas en cada programa</Pending>
            </p>
            <ProgramPicker />
          </GuideSection>

          <GuideSection id="listo" kicker="Verificador" title="¿Estoy listo?">
            <p>Marca lo que cumples.</p>
            <ReadinessChecker />
            <p className="mt-3 text-sm text-suave">
              Avance mínimo de la FCEN: <Pending /> Como referencia, la Facultad de Administración de la Sede Manizales pide el 70 % del
              componente disciplinar.
            </p>
          </GuideSection>

          <GuideSection id="cuando" kicker="Calculadora" title="¿Cuándo empiezo a buscar?">
            <p>
              Empieza <strong>entre 3 y 4 meses antes</strong> del semestre de tu práctica. La formalización y la firma de documentos con la
              empresa pueden tomar varias semanas (en otras facultades de la UNAL, de 20 a 30 días).
            </p>
            <DateCalculator />
          </GuideSection>

          <GuideSection id="ruta" kicker="Paso a paso" title="La ruta en 7 pasos">
            <Timeline
              steps={[
                {
                  title: "Arma tu perfil y véndete",
                  you: "Completa tu perfil en Talento FCEN: habilidades con nivel y evidencia, proyectos, idiomas y disponibilidad.",
                  others: "Es lo primero que ven las empresas.",
                },
                {
                  title: "Busca y conecta",
                  you: "Las empresas registradas encuentran tu perfil sin tus datos personales; las autorizadas por la Facultad pueden contactarte. Tú también puedes escribirles a las organizaciones que te interesen.",
                },
                {
                  title: "Consigue la carta de aceptación",
                  you: "Cuando una organización te elija, pídele una carta dirigida a la Facultad.",
                  docs: ["Carta de aceptación: tu nombre y documento, funciones o proyecto, fechas y tutor"],
                },
                {
                  title: "Acuerden cómo te vinculan",
                  you: "La organización y la Facultad definen la forma de vinculación y sus documentos.",
                  others: "Si se necesita un convenio, se firma antes de empezar.",
                },
                {
                  title: "Inscribe Trabajo de Grado y formaliza",
                  you: "Inscribe la asignatura en el SIA en las fechas del calendario y entrega los documentos de formalización. La Facultad asigna o avala a tu profesor director.",
                  pending: "A quién se entregan los documentos, aval del Consejo de Facultad y acta de compromiso",
                },
                {
                  title: "Durante la práctica",
                  you: "Acuerda un plan de trabajo con tu tutor y tu profesor, entrega informes de avance y lleva tu bitácora.",
                  others: "Verifica que tu afiliación a riesgos laborales (ARL) esté vigente desde el primer día.",
                },
                {
                  title: "Cierre",
                  you: "Entrega el informe final, recibe las evaluaciones de la organización y de tu profesor, y sustenta según lo que pida tu programa.",
                  others: "Pide tu certificado: la práctica cuenta como experiencia profesional (Ley 2043 de 2020).",
                },
              ]}
            />
          </GuideSection>

          <GuideSection id="vinculacion" kicker="Documentos" title="Formas de vinculación">
            <div className="overflow-x-auto">
              <table className="table-fcen">
                <thead>
                  <tr>
                    <th>Forma</th>
                    <th>Cuándo se usa</th>
                    <th>Documentos típicos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Convenio de prácticas</strong></td>
                    <td>Organizaciones que reciben practicantes con frecuencia</td>
                    <td>Minuta del convenio, Cámara de Comercio, RUT, cédula del representante legal, carta de aceptación</td>
                  </tr>
                  <tr>
                    <td><strong>Acuerdo para un estudiante</strong></td>
                    <td>La organización vincula a una sola persona (Universidad, organización y estudiante)</td>
                    <td>Acuerdo firmado y carta de aceptación</td>
                  </tr>
                  <tr>
                    <td><strong>Contrato de aprendizaje</strong></td>
                    <td>Es la forma que usa la organización; la reforma laboral (Ley 2466 de 2025) cambió sus reglas</td>
                    <td>Contrato y carta de aceptación</td>
                  </tr>
                  <tr>
                    <td><strong>Ya trabajas en la organización</strong></td>
                    <td>Si tu cargo permite actividades formativas</td>
                    <td>Contrato vigente y carta con las funciones</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm">
              <Pending>Formas que acepta la FCEN</Pending>
            </p>
          </GuideSection>

          <GuideSection id="derechos" kicker="Tus garantías" title="Derechos y deberes">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="card border-t-4 border-t-verde">
                <p className="font-black text-azul-oscuro">Tienes derecho a</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
                  <li>Que la organización te afilie y pague tu ARL desde el inicio (Decreto 055 de 2015).</li>
                  <li>Actividades acordes con tu formación y con el plan acordado.</li>
                  <li>Un tutor en la organización y un profesor de la Universidad que te acompañe.</li>
                  <li>Inducción, medios de trabajo y trato respetuoso.</li>
                  <li>Conocer, actualizar, corregir y borrar tus datos personales (Ley 1581 de 2012).</li>
                </ul>
              </div>
              <div className="card border-t-4 border-t-azul">
                <p className="font-black text-azul-oscuro">Te comprometes a</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
                  <li>Cumplir el plan, los horarios y las normas de la organización, incluidas las de seguridad y confidencialidad.</li>
                  <li>Entregar informes y bitácora a tiempo.</li>
                  <li>Mantener tu perfil y tu disponibilidad al día.</li>
                  <li>Avisar a tu profesor si algo cambia o hay problemas.</li>
                </ul>
              </div>
            </div>
          </GuideSection>

          <GuideSection id="pago" kicker="Apoyo económico" title="¿Me pagan?">
            <p>
              Depende de la forma de vinculación. En una práctica por convenio, el apoyo económico se pacta entre las partes y no siempre
              existe. En un contrato de aprendizaje, la ley fija el apoyo. Pregunta por esto antes de aceptar y verifica que quede por
              escrito.
            </p>
            <p className="mt-2 text-sm">
              <Pending>Reglas del decreto de práctica formativa de 2026</Pending>
            </p>
          </GuideSection>

          <GuideSection id="destacar" kicker="Consejos" title="Cómo hacer que tu perfil destaque">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Perfil profesional en 4 a 6 líneas", "Quién eres, qué sabes hacer y qué aportas. Di qué hiciste, no adjetivos genéricos."],
                ["Habilidades con evidencia", "Una habilidad con un proyecto o certificado enlazado vale más que una lista larga."],
                ["Proyectos con resultado", "«Construí un modelo de pronóstico en R que redujo el error a la mitad» dice más que «proyecto de series de tiempo»."],
                ["Niveles honestos", "Básico: lo usé en clase. Intermedio: en un proyecto real. Avanzado: puedo enseñarlo."],
                ["Enlaces que funcionen", "GitHub, portafolio y LinkedIn, revisados."],
                ["Confirma tu disponibilidad", "Los perfiles confirmados hace poco aparecen primero."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-lg bg-superficie p-4">
                  <p className="font-black text-azul-oscuro">{t}</p>
                  <p className="mt-1 text-sm">{d}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection id="datos" kicker="Privacidad" title="¿Quién ve mis datos?">
            <div className="overflow-x-auto">
              <table className="table-fcen">
                <tbody>
                  <tr>
                    <th>Cualquier visitante</th>
                    <td>Solo cifras y el catálogo de habilidades. Nunca tu perfil.</td>
                  </tr>
                  <tr>
                    <th>Empresa registrada</th>
                    <td>Tu perfil sin nombre, contacto ni foto: programa, avance, habilidades, idiomas, proyectos y disponibilidad.</td>
                  </tr>
                  <tr>
                    <th>Empresa autorizada</th>
                    <td>Además, nombre, correo institucional, teléfono, enlaces y hoja de vida, solo si lo aceptaste.</td>
                  </tr>
                  <tr>
                    <th>La Facultad</th>
                    <td>Todo, incluidos documento, EPS y contacto de emergencia, para formalizar tu práctica.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">Tu documento, fecha de nacimiento, EPS y contacto de emergencia nunca los ve una empresa.</p>
          </GuideSection>

          <GuideSection id="preguntas" kicker="Dudas" title="Preguntas frecuentes">
            <Faq
              items={[
                { q: "¿Tengo que conseguir yo la empresa?", a: "Sí, la búsqueda es tuya, pero Talento FCEN hace que las empresas te encuentren por tus habilidades." },
                { q: "¿Puedo hacer la práctica en otra ciudad o en remoto?", a: <>Indícalo en tu disponibilidad. Condiciones de la FCEN: <Pending /></> },
                { q: "¿Puedo hacer la práctica donde ya trabajo?", a: <>En otras facultades se acepta si las funciones son formativas y acordes a tu carrera. En la FCEN: <Pending /></> },
                { q: "¿Qué pasa si no confirmo mi disponibilidad?", a: "A los 90 días sin confirmar, tu perfil deja de aparecer ante las empresas hasta que lo confirmes de nuevo." },
                { q: "Ya me gradué, ¿puedo usar la plataforma?", a: "Sí, durante los 12 meses siguientes a tu grado." },
                { q: "¿Puedo borrar mi perfil?", a: "Sí. Puedes quitar tus autorizaciones en cualquier momento y pedirle a la Facultad que borre tu cuenta." },
              ]}
            />
          </GuideSection>

          <GuideSection id="glosario" kicker="Palabras clave" title="Glosario">
            <dl className="grid gap-3 md:grid-cols-2">
              {[
                ["Avance", "Porcentaje de créditos de tu plan de estudios que ya aprobaste."],
                ["P.A.P.A.", "Promedio Académico Ponderado Acumulado."],
                ["SIA", "Sistema de Información Académica de la Universidad."],
                ["Carta de aceptación", "Documento de la organización que dice que te recibe, para qué y con quién."],
                ["Convenio", "Acuerdo entre la Universidad y la organización para recibir practicantes."],
                ["Acuerdo tripartito", "Acuerdo de la Universidad, la organización y el estudiante para una práctica concreta."],
                ["ARL", "Administradora de Riesgos Laborales: te cubre si tienes un accidente durante la práctica."],
                ["Tutor", "Persona de la organización que orienta tu trabajo diario."],
                ["Profesor director", "Profesor de la Universidad que dirige y evalúa tu práctica como trabajo de grado."],
                ["Pasantía", "Modalidad de trabajo de grado en la que trabajas en una organización con un plan formativo."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-lg border border-borde p-3">
                  <dt className="font-black text-azul-oscuro">{t}</dt>
                  <dd className="mt-1 text-sm">{d}</dd>
                </div>
              ))}
            </dl>
          </GuideSection>

          <section className="py-10">
            <div className="card-dark p-8">
              <p className="display text-2xl">¿Listo para empezar?</p>
              <p className="mt-2 text-white/80">Crea tu perfil con tu cuenta @unal.edu.co.</p>
              <Link href="/ingresar?como=estudiante" className="btn btn-accent mt-4">
                Crear mi perfil
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
