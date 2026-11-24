import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CALL_SELECT, type CallWithRelations } from "@/lib/calls";
import { AdminTitle } from "../../../admin-title";
import { CallForm } from "../../call-form";
import { formOptions } from "../../form-options";

export const metadata: Metadata = { title: "Editar convocatoria" };
export const dynamic = "force-dynamic";

export default async function EditCall({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, options] = await Promise.all([supabase.from("calls").select(CALL_SELECT).eq("id", id).maybeSingle(), formOptions()]);
  if (!data) notFound();
  const call = data as unknown as CallWithRelations;

  return (
    <div>
      <Link href={`/admin/convocatorias/${id}`} className="text-sm text-suave hover:text-azul">
        <ArrowLeft className="mr-1 inline h-4 w-4 align-[-0.2rem]" aria-hidden="true" /> {call.title}
      </Link>
      <div className="mt-3">
        <AdminTitle icon={Pencil} title="Editar convocatoria" description={`${call.company_name} · convocatoria n.º ${call.code}`} />
      </div>
      <CallForm call={call} {...options} />
    </div>
  );
}
