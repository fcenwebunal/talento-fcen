import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { collectStudents, filtersFrom, skillsText } from "@/lib/collect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = [
  ["perfil", "Perfil"],
  ["nombre", "Nombre"],
  ["correo", "Correo"],
  ["programa", "Programa"],
  ["nivel", "Nivel"],
  ["situacion", "Situación"],
  ["estado", "Estado"],
  ["avance", "Avance (%)"],
  ["avance_verificacion", "Verificación del avance"],
  ["papa", "PAPA"],
  ["periodo", "Periodo de práctica"],
  ["desde", "Disponible desde"],
  ["ciudad", "Ciudad"],
  ["modalidades", "Modalidades"],
  ["idiomas", "Idiomas"],
  ["habilidades", "Habilidades"],
  ["titular", "Titular"],
  ["enlace", "Perfil en la plataforma"],
] as const;

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// The file is built on request and sent as a download; it is never stored. Each export is logged.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "staff" && session.role !== "admin")) return new NextResponse("Solo para la Facultad.", { status: 403 });
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const filters = filtersFrom(params);
  const format = params.formato === "pdf" ? "pdf" : "csv";
  const supabase = await createClient();

  const students = await collectStudents(supabase, filters);
  await supabase.from("exports_log").insert({ company_id: null, user_id: session.userId, filters: { ...filters, formato: format, origen: "recoger_datos" }, row_count: students.length });

  const date = new Date().toISOString().slice(0, 10);
  if (format === "pdf") {
    const { renderCollectionPdf } = await import("@/lib/collect-pdf");
    const filtersText = [
      filters.estado === "todos" ? "Disponibles o en proceso" : filters.estado === "disponible" ? "Disponibles" : "En proceso con una empresa",
      params.programaNombre ? `programa ${params.programaNombre}` : null,
      params.habilidadNombre ? `con ${params.habilidadNombre}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    const pdf = await renderCollectionPdf(students, { filtersText });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="estudiantes-fcen-${date}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const lines = [
    COLUMNS.map(([, label]) => label).join(","),
    ...students.map((st) => {
      const row: Record<(typeof COLUMNS)[number][0], unknown> = {
        perfil: st.name ? "Con contacto" : "Anónimo",
        nombre: st.name,
        correo: st.email,
        programa: st.program,
        nivel: st.level,
        situacion: st.status,
        estado: st.availability,
        avance: st.progress,
        avance_verificacion: st.progress !== null ? st.progressNote : "",
        papa: st.papa,
        periodo: st.period,
        desde: st.from,
        ciudad: st.city,
        modalidades: st.modalities,
        idiomas: st.languages,
        habilidades: skillsText(st),
        titular: st.headline,
        enlace: st.link,
      };
      return COLUMNS.map(([key]) => csvCell(row[key])).join(",");
    }),
  ];
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="estudiantes-fcen-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
