import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { fileSlug, formatDate, VERIFIED_LABEL } from "@/lib/labels";
import { APPLICATION_STATUS_LABEL, type Applicant } from "@/lib/calls";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const text = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const decimal = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));

// Applicants of a call as CSV for Excel in Spanish (semicolons, decimal commas). call_applicants decides who may read it.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Inicia sesión para descargar los postulantes.", { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const { id } = await params;
  const supabase = await createClient();
  const [{ data, error }, { data: call }] = await Promise.all([
    supabase.rpc("call_applicants", { p_call: id }),
    supabase.from("calls").select("title, company_name").eq("id", id).maybeSingle(),
  ]);
  if (error || !call) return new NextResponse("No tienes acceso a los postulantes de esta convocatoria.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });

  const staff = session.role === "staff" || session.role === "admin";
  const header = ["Nombre", "Correo", "Celular", "Ciudad", "Programa", "Avance (%)", "Avance verificado", "PAPA", "Cumple requisitos", "Estado", "Fecha de postulación", "Mensaje"];
  if (staff) header.push("Nota interna");
  const rows = (data as Applicant[]).map((a) => {
    const row = [
      a.full_name, a.email, a.phone, a.city, a.program, decimal(a.progress_pct), VERIFIED_LABEL[a.progress_verified] ?? a.progress_verified, decimal(a.papa),
      a.meets_requirements ? "Sí" : "No", APPLICATION_STATUS_LABEL[a.status], formatDate(a.created_at), a.message,
    ];
    if (staff) row.push(a.staff_note);
    return row.map(cell).join(";");
  });
  const csv = "﻿" + [header.join(";"), ...rows].join("\r\n");
  const name = `postulantes_${fileSlug(call.company_name)}_${fileSlug(call.title)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
