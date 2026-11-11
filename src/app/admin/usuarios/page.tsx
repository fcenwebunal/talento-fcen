import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, MailPlus, Search, ShieldAlert, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { formatDate } from "@/lib/labels";
import { ROLE_LABEL, ROLES, isRole } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { AdminTitle } from "../admin-title";
import { deleteInvite } from "../actions";
import { ApproveForm, InviteForm, RoleForm } from "./forms";

export const metadata: Metadata = { title: "Usuarios y roles" };
export const dynamic = "force-dynamic";

type Profile = { id: string; email: string; full_name: string | null; role: Role; avatar_path: string | null; provider: string; created_at: string };
type Invite = {
  email: string;
  role: Role;
  created_at: string;
  student_data: { program_name?: string; progress_pct?: number; source?: string } | null;
  profiles: { email: string } | null;
};

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; rol?: string }> }) {
  const session = await requireRole(["staff", "admin"]);
  const isAdmin = session.role === "admin";
  const { q, rol } = await searchParams;
  const filter = isRole(rol) ? rol : null;
  // Only plain text reaches the PostgREST «or» filter, whose syntax uses commas and parentheses
  const needle = (q ?? "").replace(/[^\p{L}\p{N}@._\- ]/gu, "").trim();
  const supabase = await createClient();

  let query = supabase.from("profiles").select("id, email, full_name, role, avatar_path, provider, created_at").order("created_at", { ascending: false }).limit(200);
  if (filter) query = query.eq("role", filter);
  if (needle) query = query.or(`email.ilike.%${needle}%,full_name.ilike.%${needle}%`);

  const [{ data }, { data: invites }, ...counts] = await Promise.all([
    query,
    supabase.from("role_invites").select("email, role, created_at, student_data, profiles(email)").order("created_at", { ascending: false }),
    ...ROLES.map((r) => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", r)),
  ]);
  const users = (data ?? []) as Profile[];
  const pendingInvites = (invites ?? []) as unknown as Invite[];
  const countOf = Object.fromEntries(ROLES.map((r, i) => [r, counts[i].count ?? 0])) as Record<Role, number>;
  const total = ROLES.reduce((sum, r) => sum + countOf[r], 0);
  const hrefFor = (r: Role | null) => {
    const params = new URLSearchParams({ ...(r ? { rol: r } : {}), ...(needle ? { q: needle } : {}) });
    return `/admin/usuarios${params.size ? `?${params}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <AdminTitle icon={KeyRound} title="Usuarios y roles" description={`${total} cuentas`} />
      <p className="max-w-3xl text-sm text-suave">
        Toda cuenta nueva, de la UNAL o externa, entra como «Usuario» y solo puede editar su cuenta hasta que tenga un rol.{" "}
        {isAdmin
          ? "La Facultad puede aprobar usuarios como estudiantes; los demás roles, y cualquier cambio de un rol ya asignado, los haces tú como administrador."
          : "Puedes aprobar como estudiantes a los usuarios nuevos; los demás roles los asigna un administrador."}
      </p>

      {isAdmin && (
        <section className="card space-y-3" aria-labelledby="registrar">
          <h2 id="registrar" className="flex items-center gap-2 font-black text-azul-oscuro">
            <MailPlus className="h-5 w-5 text-azul-medio" aria-hidden="true" /> Registrar un usuario
          </h2>
          <p className="text-sm text-suave">
            La persona recibe el rol la primera vez que entra con Google con ese correo (cuenta UNAL o cualquier cuenta de Google). Si ya tiene cuenta, el rol
            cambia de inmediato.
          </p>
          <InviteForm />
        </section>
      )}

      {pendingInvites.length > 0 && (
        <section className="card space-y-3" aria-labelledby="registrados">
          <h2 id="registrados" className="font-black text-azul-oscuro">
            Registrados que aún no han entrado ({pendingInvites.length})
          </h2>
          <ul className="divide-y divide-borde text-sm">
            {pendingInvites.map((inv) => (
              <li key={inv.email} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                <span className="min-w-0 flex-1 truncate font-black text-azul-oscuro">{inv.email}</span>
                <span className="chip chip-azul">{ROLE_LABEL[inv.role]}</span>
                {inv.student_data?.program_name && (
                  <span className="text-xs text-texto">
                    {inv.student_data.program_name}
                    {typeof inv.student_data.progress_pct === "number" ? ` · avance ${inv.student_data.progress_pct.toLocaleString("es-CO")} %` : ""}
                  </span>
                )}
                <span className="text-xs text-suave">
                  {formatDate(inv.created_at)}
                  {inv.profiles?.email ? ` · por ${inv.profiles.email}` : inv.student_data?.source ? ` · ${inv.student_data.source}` : ""}
                </span>
                {isAdmin && (
                  <form action={deleteInvite}>
                    <input type="hidden" name="email" value={inv.email} />
                    <button className="btn btn-danger btn-sm" aria-label={`Quitar el registro de ${inv.email}`}>
                      <Trash2 /> Quitar
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="flex flex-wrap items-center gap-2" aria-label="Filtrar por rol">
        <Link href={hrefFor(null)} className={`btn btn-sm ${filter ? "btn-secondary" : "btn-primary"}`} aria-current={filter ? undefined : "page"}>
          Todos ({total})
        </Link>
        {ROLES.map((r) => (
          <Link
            key={r}
            href={hrefFor(r)}
            className={`btn btn-sm ${filter === r ? "btn-primary" : r === "user" && countOf.user > 0 ? "btn-accent" : "btn-secondary"}`}
            aria-current={filter === r ? "page" : undefined}
          >
            {r === "user" ? "Por aprobar" : ROLE_LABEL[r]} ({countOf[r]})
          </Link>
        ))}
      </nav>

      <form method="get" className="flex gap-2">
        {filter && <input type="hidden" name="rol" value={filter} />}
        <div className="input-icon max-w-sm flex-1">
          <Search aria-hidden="true" />
          <input name="q" defaultValue={needle} placeholder="Buscar por correo o nombre" className="input" />
        </div>
        <button className="btn btn-secondary">Buscar</button>
      </form>

      <div className="table-wrap">
        <table className="table-fcen">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Rol</th>
              <th>Creada</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className="flex items-center gap-3">
                    <Avatar name={u.full_name ?? u.email} seed={u.id} src={u.avatar_path ? supabase.storage.from("avatars").getPublicUrl(u.avatar_path).data.publicUrl : null} size={42} />
                    <span className="min-w-0">
                      <span className="block font-black text-azul-oscuro">{u.full_name || "Sin nombre"}</span>
                      <span className="block truncate text-xs text-suave">{u.email}</span>
                      {u.provider === "google" ? (
                        <span className="block text-[0.6875rem] text-verde-tinta">Entra con Google: correo verificado</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[0.6875rem] text-naranja" title="La cuenta se creó con correo y contraseña, sin confirmar el correo: no prueba que la persona sea dueña de esa dirección.">
                          <ShieldAlert className="h-3 w-3" aria-hidden="true" /> Correo y contraseña: correo sin verificar
                        </span>
                      )}
                    </span>
                  </span>
                </td>
                <td>
                  {u.id === session.userId ? (
                    <span className="text-sm">{ROLE_LABEL[u.role]} (tú)</span>
                  ) : isAdmin ? (
                    <RoleForm userId={u.id} role={u.role} />
                  ) : u.role === "user" ? (
                    <ApproveForm userId={u.id} />
                  ) : (
                    <span className="text-sm">{ROLE_LABEL[u.role]}</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-sm text-suave">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="mt-4 text-suave">No hay cuentas con esos filtros.</p>}
        {users.length === 200 && <p className="mt-4 text-xs text-suave">Se muestran las 200 más recientes; usa la búsqueda para encontrar otras.</p>}
      </div>
    </div>
  );
}
