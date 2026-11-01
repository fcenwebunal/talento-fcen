import Link from "next/link";
import { requireRole } from "@/lib/session";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/empresas", label: "Empresas" },
  { href: "/admin/estudiantes", label: "Estudiantes" },
  { href: "/admin/catalogo", label: "Habilidades" },
  { href: "/admin/registros", label: "Registros" },
  { href: "/admin/usuarios", label: "Roles" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["staff", "admin"]);
  return (
    <div className="wrap py-8">
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-borde pb-3 text-sm">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 font-bold text-azul-oscuro hover:bg-superficie">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
