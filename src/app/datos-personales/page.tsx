import type { Metadata } from "next";
import { Pending } from "@/components/guide";

export const metadata: Metadata = { title: "Tratamiento de datos personales" };

export default function DataPolicyPage() {
  return (
    <div className="wrap max-w-3xl py-12">
      <h1 className="display text-4xl text-azul-oscuro">Tratamiento de datos personales</h1>
      <div className="prose-fcen mt-6 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-azul-oscuro">Responsable</h2>
          <p>
            Universidad Nacional de Colombia, Facultad de Ciencias Exactas y Naturales, Sede Manizales, en cumplimiento de la Ley 1581 de
            2012 y sus decretos reglamentarios. <Pending>Referencia a la política institucional vigente y canal oficial de atención</Pending>
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-azul-oscuro">Finalidad</h2>
          <p>
            Conectar a estudiantes y egresados recientes de la Facultad con organizaciones que buscan practicantes, y gestionar la
            formalización de las prácticas. Los datos no se usan para otros fines.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-azul-oscuro">Qué datos se comparten y con quién</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Empresas registradas</strong>: el perfil sin nombre, contacto ni foto, solo si el estudiante aceptó aparecer.
            </li>
            <li>
              <strong>Empresas autorizadas por la Facultad</strong>: además, nombre, correo institucional, teléfono, enlaces y hoja de vida,
              solo si el estudiante lo aceptó. Pueden exportar listados sin datos sensibles; cada exportación queda registrada.
            </li>
            <li>
              <strong>Solo la Facultad</strong>: documento de identidad, fecha de nacimiento, EPS, contacto de emergencia, correo personal e
              historia académica.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-azul-oscuro">Tus derechos</h2>
          <p>
            Conocer, actualizar, rectificar y pedir la supresión de tus datos, y revocar las autorizaciones en cualquier momento desde tu
            perfil (sección «Documentos y autorización»).
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-azul-oscuro">Obligaciones de las empresas</h2>
          <p>
            Usar los datos solo para seleccionar practicantes, no cederlos a terceros y eliminar los listados exportados al terminar su
            proceso.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-azul-oscuro">Dónde se guardan</h2>
          <p>
            En servidores de proveedores de nube ubicados en Estados Unidos, país incluido por la Superintendencia de Industria y Comercio
            en la lista de países con nivel adecuado de protección de datos.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-azul-oscuro">Vigencia de los perfiles</h2>
          <p>
            Un perfil que no se confirma en 90 días deja de aparecer ante las empresas. Los egresados pueden usar la plataforma hasta 12 meses
            después de su grado; luego el perfil se archiva.
          </p>
        </section>
      </div>
    </div>
  );
}
