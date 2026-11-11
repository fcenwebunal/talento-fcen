"use client";

import { useActionState } from "react";
import { CheckCircle2, GraduationCap, Loader2, Save, TriangleAlert, UserPlus } from "lucide-react";
import { ASSIGNABLE_ROLES, ROLE_HINT, ROLE_LABEL, ROLES } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { changeRole, inviteUser, type RoleActionState } from "../actions";

function Feedback({ state }: { state: RoleActionState }) {
  if (!state) return null;
  return (
    <span role={state.ok ? "status" : "alert"} className={`flex items-start gap-1 text-xs ${state.ok ? "text-verde-tinta" : "text-naranja"}`}>
      {state.ok ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {state.message}
    </span>
  );
}

export function RoleForm({ userId, role }: { userId: string; role: Role }) {
  const [state, action, pending] = useActionState(changeRole, null);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="user_id" value={userId} />
      <div className="flex gap-2">
        <select name="role" defaultValue={role} className="input py-1" aria-label="Rol">
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <button className="btn btn-secondary btn-sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Guardar
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function ApproveForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(changeRole, null);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="role" value="student" />
      <button className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <GraduationCap />} Aprobar como estudiante
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteUser, null);
  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="field min-w-60 flex-1">
          <span>Correo</span>
          <input name="email" type="email" required autoComplete="off" spellCheck={false} placeholder="nombre@unal.edu.co" className="input" />
        </label>
        <label className="field">
          <span>Rol</span>
          <select name="role" defaultValue="student" className="input">
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}: {ROLE_HINT[r].toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} Registrar
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}
