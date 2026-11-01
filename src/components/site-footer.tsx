import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-borde bg-superficie">
      <div className="wrap grid gap-6 py-8 text-sm text-suave md:grid-cols-3">
        <div>
          <p className="display text-base text-azul-oscuro">Talento FCEN</p>
          <p className="mt-1">
            Facultad de Ciencias Exactas y Naturales
            <br />
            Universidad Nacional de Colombia, Sede Manizales
          </p>
          <p className="mt-2">
            <span className="chip chip-amarillo">Versión beta</span>
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Link href="/guia/estudiantes" className="hover:text-azul">
            Guía para estudiantes
          </Link>
          <Link href="/guia/empresas" className="hover:text-azul">
            Guía para empresas
          </Link>
          <Link href="/habilidades" className="hover:text-azul">
            Habilidades de la Facultad
          </Link>
          <Link href="/datos-personales" className="hover:text-azul">
            Tratamiento de datos personales
          </Link>
        </div>
        <div>
          <a href="https://fcen.unal.edu.co" target="_blank" rel="noopener" className="hover:text-azul">
            fcen.unal.edu.co
          </a>
        </div>
      </div>
    </footer>
  );
}
