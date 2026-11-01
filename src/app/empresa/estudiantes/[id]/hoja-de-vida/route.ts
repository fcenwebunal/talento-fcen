import { NextResponse, type NextRequest } from "next/server";
import { localRedirect } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.level < 2) return localRedirect("/empresa");
  const { id } = await params;
  const supabase = await createClient();

  const { data: detail } = await supabase.rpc("get_student_detail", { p_student: id });
  const path = (detail as { contact?: { cv_path?: string | null } } | null)?.contact?.cv_path;
  if (!path) return new NextResponse("Hoja de vida no disponible", { status: 404 });

  const { data } = await supabase.storage.from("documentos").createSignedUrl(path, 60);
  if (!data?.signedUrl) return new NextResponse("Hoja de vida no disponible", { status: 404 });

  if (session.company) {
    await supabase.from("contact_events").insert({ company_id: session.company.id, user_id: session.userId, student_id: id, kind: "download_cv" });
  }
  return NextResponse.redirect(data.signedUrl);
}
