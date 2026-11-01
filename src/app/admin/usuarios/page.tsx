import type { Metadata } from "next";
import { KeyRound, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { AdminTitle } from "../admin-title";
import { getSession } from "@/lib/session";
import { setRole } from "../actions";

export const metadata: Metadata = { title: "Roles" };
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { student: "Estudiante", staff: "Facultad", admin: "Administrador", company: "Empresa" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession();
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("profiles").select("id, email, full_name, role").neq("role", "company").order("email").limit(100);
  if (q) query = query.ilike("email", `%${q}%`);
  const { data } = await query;
  const isAdmin = session?.role === "admin";

  return (
    <div>
      <AdminTitle icon={KeyRound} title="Roles" />
      <p className="text-sm text-suave">
        Las personas de la Facultad entran con su cuenta @unal.edu.co y quedan como estudiantes; aquí se les asigna el rol «Facultad».
        {!isAdmin && " Solo un administrador puede cambiar roles."}
      </p>
      <form method="get" className="mt-4 flex gap-2">
        <div className="input-icon max-w-sm flex-1">
          <Search aria-hidden="true" />
          <input name="q" defaultValue={q} placeholder="Buscar por correo" className="input" />
        </div>
        <button className="btn btn-secondary">Buscar</button>
      </form>
      <div className="table-wrap mt-6">
      <table className="table-fcen">
        <thead>
          <tr>
            <th>Correo</th>
            <th>Nombre</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((u) => (
            <tr key={u.id}>
              <td>
                <span className="flex items-center gap-3">
                  <Avatar name={u.full_name ?? u.email} seed={u.id} size={32} />
                  {u.email}
                </span>
              </td>
              <td>{u.full_name}</td>
              <td>
                {isAdmin && u.id !== session?.userId ? (
                  <form action={setRole} className="flex gap-2">
                    <input type="hidden" name="user_id" value={u.id} />
                    <select name="role" defaultValue={u.role} className="input py-1">
                      <option value="student">Estudiante</option>
                      <option value="staff">Facultad</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <button className="btn btn-secondary py-1">Guardar</button>
                  </form>
                ) : (
                  ROLE_LABEL[u.role]
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
