import type { Metadata } from "next";
import Link from "next/link";
import { Faq, GuideSection, Pending, Timeline, Toc } from "@/components/guide";
import { Constellation, Rings, StepDivider } from "@/components/ui/decor";

export const metadata: Metadata = { title: "Guía para empresas" };

const TOC = [
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "talento", label: "El talento de la FCEN" },
  { id: "requisitos", label: "Qué se espera de su organización" },
  { id: "vinculacion", label: "Formas de vinculación" },
  { id: "tiempos", label: "Duración y tiempos" },
  { id: "datos", label: "Uso de los datos" },
  { id: "preguntas", label: "Preguntas frecuentes" },
];

const TALENT = [
  { name: "Estadística", items: "Análisis de datos y tableros, encuestas, pronósticos, control de calidad" },
  { name: "Ciencias de la Computación", items: "Desarrollo de software, ciencia de datos, seguridad informática, automatización" },
  { name: "Matemáticas", items: "Modelación, optimización, simulación, finanzas cuantitativas, docencia" },
  { name: "Ingeniería Física", items: "Instrumentación y metrología, materiales y óptica, prototipado, simulación" },
  { name: "Ingeniería Biológica", items: "Bioprocesos, microbiología, control de calidad, I+D en alimentos y farmacéutica" },
  { name: "Posgrados", items: "Actuaría y finanzas, estadística y ciencia de datos, nanotecnología, energía solar, física, matemática aplicada" },
];

export default function CompanyGuide() {
  return (
    <>
      <section className="bg-hero relative overflow-hidden text-white">
        <div className="bg-dots-light mask-fade-b absolute inset-0" />
        <Rings className="animate-spin-slow absolute -right-40 -top-40 w-[34rem] text-verde" />
        <Constellation className="animate-float-slow absolute bottom-8 right-[8%] hidden w-64 text-white md:block" />
        <div className="wrap stagger relative pb-24 pt-12 md:pt-16">
          <p className="kicker kicker-light">Guía para empresas</p>
          <h1 className="display mt-2 max-w-3xl text-4xl md:text-5xl">Encuentre en la FCEN el talento que su organización necesita</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            Estudiantes y egresados recientes de cinco pregrados y nueve posgrados, con sus habilidades a la vista. Registrarse es gratis.
          </p>
          <Link href="/ingresar?como=empresa" className="btn btn-accent mt-8">
            Registrar mi organización
          </Link>
        </div>
        <StepDivider className="absolute inset-x-0 bottom-0" />
      </section>

      <div className="wrap grid gap-10 lg:grid-cols-[14rem_1fr]">
        <aside className="hidden pt-12 lg:block">
          <Toc items={TOC} />
        </aside>
        <div className="min-w-0 max-w-3xl divide-y divide-dashed divide-borde">
          <GuideSection id="como-funciona" kicker="Paso a paso" title="Cómo funciona">
            <Timeline
              steps={[
                { title: "Regístrese", you: "Con los datos de su organización. Desde ese momento puede buscar perfiles anónimos por habilidad, programa, disponibilidad, modalidad y ciudad." },
                { title: "Solicite la autorización", you: "La Facultad verifica la existencia de su organización (NIT y Cámara de Comercio, o la norma de creación si es una entidad pública) y la persona de contacto." },
                { title: "Vea, contacte y exporte", you: "Ya autorizada, ve los datos de contacto de quienes lo permitieron, descarga hojas de vida y exporta listados para su proceso.", others: "La autorización dura 12 meses y se renueva." },
                { title: "Seleccione", you: "Contacte y seleccione a sus candidatos con su propio proceso." },
                { title: "Formalice con la Facultad", you: "Antes de que el estudiante empiece, se formaliza la práctica con la Facultad y su forma de vinculación." },
              ]}
            />
          </GuideSection>

          <GuideSection id="talento" kicker="Programas" title="El talento de la FCEN">
            <div className="grid gap-3 sm:grid-cols-2">
              {TALENT.map((t) => (
                <div key={t.name} className="card">
                  <p className="font-black text-azul-oscuro">{t.name}</p>
                  <p className="mt-1 text-sm text-suave">{t.items}</p>
                </div>
              ))}
            </div>
            <Link href="/habilidades" className="btn btn-secondary mt-4">
              Ver el catálogo completo de habilidades
            </Link>
          </GuideSection>

          <GuideSection id="requisitos" kicker="Compromisos" title="Qué se espera de su organización">
            <ul className="list-disc space-y-2 pl-5">
              <li>Estar legalmente constituida.</li>
              <li>Asignar actividades formativas acordes con el programa del estudiante, según un plan de trabajo.</li>
              <li>Designar un <strong>tutor</strong> que oriente, haga seguimiento, mantenga contacto con el profesor de la Universidad y evalúe al final.</li>
              <li>Afiliar al estudiante a <strong>riesgos laborales (ARL)</strong> y pagar los aportes durante toda la práctica (Decreto 055 de 2015, artículo 4).</li>
              <li>Dar inducción, espacio y herramientas de trabajo, y un trato respetuoso.</li>
              <li>Diligenciar la evaluación del practicante al final.</li>
            </ul>
            <p className="mt-3 text-sm">
              Requisitos propios de la FCEN: <Pending />
            </p>
          </GuideSection>

          <GuideSection id="vinculacion" kicker="Documentos" title="Formas de vinculación">
            <div className="overflow-x-auto">
              <table className="table-fcen">
                <thead>
                  <tr>
                    <th>Forma</th>
                    <th>Recomendada cuando</th>
                    <th>Documentos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Convenio de prácticas</strong></td>
                    <td>Planea recibir practicantes con frecuencia</td>
                    <td>Minuta del convenio, Certificado de Existencia y Representación Legal, RUT, cédula del representante legal</td>
                  </tr>
                  <tr>
                    <td><strong>Acuerdo para un estudiante</strong></td>
                    <td>Recibirá a una sola persona</td>
                    <td>Acuerdo firmado y carta de aceptación</td>
                  </tr>
                  <tr>
                    <td><strong>Contrato de aprendizaje</strong></td>
                    <td>Es su forma habitual de vincular aprendices (reglas de la Ley 2466 de 2025)</td>
                    <td>Contrato y carta de aceptación</td>
                  </tr>
                  <tr>
                    <td><strong>El estudiante ya trabaja con ustedes</strong></td>
                    <td>Su cargo permite actividades formativas</td>
                    <td>Contrato vigente y carta con las funciones</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              La <strong>carta de aceptación</strong> va dirigida a la Facultad e incluye el nombre y documento del estudiante, las funciones o
              el proyecto, las fechas y el nombre del tutor.
            </p>
            <p className="mt-2 text-sm">
              <Pending>Formas que acepta la FCEN, minuta de convenio vigente y tiempos de firma</Pending>
            </p>
          </GuideSection>

          <GuideSection id="tiempos" kicker="Planeación" title="Duración y tiempos">
            <ul className="list-disc space-y-2 pl-5">
              <li>Duración habitual en la Universidad: <strong>4 a 6 meses</strong>, ajustada al semestre académico del estudiante. <Pending>En la FCEN</Pending></li>
              <li>Si hace falta un convenio, debe estar firmado antes de que el estudiante empiece.</li>
              <li>Planee con anticipación: en otras facultades de la UNAL, la formalización toma de 20 a 30 días.</li>
            </ul>
          </GuideSection>

          <GuideSection id="datos" kicker="Privacidad" title="Uso de los datos de los estudiantes">
            <p>
              Al aceptar los términos, su organización se compromete a usar los datos <strong>solo para seleccionar practicantes</strong>, no
              cederlos a terceros y eliminar los listados exportados al terminar su proceso. Cada consulta y exportación queda registrada. La
              Universidad Nacional de Colombia es responsable del tratamiento de estos datos según la Ley 1581 de 2012.
            </p>
          </GuideSection>

          <GuideSection id="preguntas" kicker="Dudas" title="Preguntas frecuentes">
            <Faq
              items={[
                { q: "¿Tiene costo?", a: "No. Registrarse y buscar talento es gratis." },
                { q: "¿Puedo publicar una oferta?", a: "En esta versión usted busca y contacta directamente. Las ofertas llegarán en una próxima versión." },
                { q: "¿Debo pagarle al practicante?", a: <>Depende de la forma de vinculación: en el contrato de aprendizaje la ley fija el apoyo; en un convenio se pacta. <Pending>Reglas del decreto de práctica formativa de 2026</Pending></> },
                { q: "¿Quién responde si el estudiante tiene un accidente?", a: "La ARL a la que su organización lo afilió." },
                { q: "¿Con quién hablo en la Facultad?", a: <Pending>Contacto oficial de prácticas de la FCEN</Pending> },
              ]}
            />
          </GuideSection>
        </div>
      </div>
    </>
  );
}
