import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { AdminTitle } from "../../admin-title";
import { CallForm } from "../call-form";
import { formOptions } from "../form-options";

export const metadata: Metadata = { title: "Nueva convocatoria" };
export const dynamic = "force-dynamic";

export default async function NewCall() {
  const options = await formOptions();
  return (
    <div>
      <Link href="/admin/convocatorias" className="text-sm text-suave hover:text-azul">
        <ArrowLeft className="mr-1 inline h-4 w-4 align-[-0.2rem]" aria-hidden="true" /> Convocatorias
      </Link>
      <div className="mt-3">
        <AdminTitle icon={Megaphone} title="Nueva convocatoria" description="Los campos con * son obligatorios. Puedes guardarla como borrador y publicarla después." />
      </div>
      <CallForm call={null} {...options} />
    </div>
  );
}
