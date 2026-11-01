import { NextResponse, type NextRequest } from "next/server";
import { localRedirect } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { filtersFrom } from "@/lib/search";

const COLUMNS = [
  "nombre", "correo", "programa", "nivel", "avance", "habilidades", "idiomas",
  "disponibilidad", "periodo", "modalidades", "ciudad", "linkedin", "github", "portafolio",
] as const;

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.level < 2) return localRedirect("/empresa");

  const params = Object.fromEntries(
    [...new Set(request.nextUrl.searchParams.keys())].map((k) => [k, request.nextUrl.searchParams.getAll(k)])
  );
  const { page: _page, limit: _limit, offset: _offset, include_unlisted: _unlisted, ...filters } = filtersFrom(params);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_students", { p_filters: filters });
  if (error) {
    const message = /EXPORT_LIMIT/.test(error.message)
      ? "Alcanzó el máximo de exportaciones de hoy."
      : "No se pudo exportar.";
    return new NextResponse(message, { status: 429, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const date = new Date().toISOString().slice(0, 10);
  const owner = session.company?.name ?? "Facultad";
  const lines = [
    `# Exportado por ${owner} el ${date} desde Talento FCEN. Uso exclusivo para selección de practicantes.`,
    COLUMNS.join(","),
    ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(",")),
  ];
  const slug = owner.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();

  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="talento-fcen-${slug}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
