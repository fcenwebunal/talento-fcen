import Link from "next/link";
import { getSession, homeFor } from "@/lib/session";

const ROLE_LABEL = { student: "Mi perfil", company: "Mi empresa", staff: "Administración", admin: "Administración" };

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="bg-azul-oscuro text-white">
      <div className="h-1 bg-verde" />
      <div className="wrap flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="display text-xl">
            Talento <span className="text-verde">FCEN</span>
          </span>
          <span className="text-xs text-white/75">Facultad de Ciencias Exactas y Naturales · UNAL Manizales</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <Link href="/guia/estudiantes" className="rounded-md px-3 py-2 hover:bg-white/10">
            Estudiantes
          </Link>
          <Link href="/guia/empresas" className="rounded-md px-3 py-2 hover:bg-white/10">
            Empresas
          </Link>
          <Link href="/habilidades" className="rounded-md px-3 py-2 hover:bg-white/10">
            Habilidades
          </Link>
          {session ? (
            <>
              <Link href={homeFor(session.role)} className="rounded-md bg-white/10 px-3 py-2 font-bold hover:bg-white/20">
                {ROLE_LABEL[session.role]}
              </Link>
              <form action="/auth/salir" method="post">
                <button className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">Salir</button>
              </form>
            </>
          ) : (
            <Link href="/ingresar" className="rounded-md bg-verde px-3 py-2 font-bold text-azul-oscuro hover:brightness-105">
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
