import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { previewAs } from "@/lib/cv";
import type { StudentDetail } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const describe = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e)).slice(0, 400);

// Builds the CV PDF on request with the viewer's own permissions and streams it as a download; nothing is stored.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Inicia sesión para descargar la hoja de vida.", { status: 401 });
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_student_detail", { p_student: id });
  if (error || !data) return new NextResponse("Hoja de vida no disponible.", { status: 404 });
  let detail = data as StudentDetail;

  // «Cómo me ven»: the student downloads exactly what a company of that level would get
  const self = session.userId === id;
  const nivel = request.nextUrl.searchParams.get("nivel");
  if (self && (nivel === "registrada" || nivel === "autorizada")) {
    const { data: student } = await supabase.from("students").select("consent_contact").eq("id", id).single();
    detail = previewAs(detail, { authorized: nivel === "autorizada", consentContact: !!student?.consent_contact });
  }

  let photo: Buffer | null = null;
  if (detail.contact_visible) {
    try {
      const { data: files } = await supabase.storage.from("documentos").list(`${id}/foto`, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
      const { data: blob } = files?.[0] ? await supabase.storage.from("documentos").download(`${id}/foto/${files[0].name}`) : { data: null };
      if (blob) {
        // react-pdf only embeds JPEG and PNG; student photos are often WebP
        const { default: sharp } = await import("sharp");
        photo = await sharp(Buffer.from(await blob.arrayBuffer())).resize(240, 240, { fit: "cover" }).jpeg({ quality: 84 }).toBuffer();
      }
    } catch (e) {
      console.error("cv photo", e);
    }
  }

  let pdf: Buffer;
  try {
    const { renderCv } = await import("@/lib/cv-pdf");
    pdf = await renderCv(detail, { photo });
  } catch (e) {
    console.error("cv render", e);
    return new NextResponse(`No se pudo generar la hoja de vida. ${describe(e)}`, { status: 500 });
  }

  if (session.company && detail.contact_visible && !self) {
    await supabase.from("contact_events").insert({ company_id: session.company.id, user_id: session.userId, student_id: id, kind: "download_cv" });
  }

  const name = `Hoja de vida - ${detail.contact_visible && detail.contact?.full_name ? detail.contact.full_name : `Perfil anónimo - ${detail.program ?? ""}`}.pdf`;
  const ascii = name.normalize("NFD").replace(/[^\x20-\x7E]/g, "").replace(/"/g, "");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
