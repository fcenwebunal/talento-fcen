"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CompanyForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("register_company", {
      p_data: { ...payload, is_public_entity: payload.is_public_entity === "on", terms_accepted: payload.terms === "on" },
    });
    setLoading(false);
    if (error) {
      setError(
        /duplicate|unique/i.test(error.message)
          ? "Ya existe una organización registrada con ese NIT. Pida a quien la registró que le dé acceso, o escríbale a la Facultad."
          : /TERMS_REQUIRED/.test(error.message)
            ? "Debe aceptar los términos de uso de datos."
            : `No se pudo registrar. ${error.message}`
      );
      return;
    }
    router.replace("/empresa");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card page-in space-y-6 p-6 md:p-8">
      <h2 className="flex items-center gap-2 font-black text-azul-oscuro"><span className="icon-tile h-9 w-9"><Building2 className="!h-4 !w-4" /></span> Datos de la organización</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field md:col-span-2">
          <span>Razón social</span>
          <input name="name" required className="input" />
        </label>
        <label className="field">
          <span>NIT</span>
          <input name="nit" required className="input" placeholder="900123456-7" />
        </label>
        <label className="field">
          <span>Sector</span>
          <input name="sector" className="input" placeholder="Tecnología, banca, alimentos…" />
        </label>
        <label className="field">
          <span>Tamaño</span>
          <select name="size" className="input" defaultValue="">
            <option value="">Elegir…</option>
            <option value="micro">Microempresa (hasta 10 personas)</option>
            <option value="pequena">Pequeña (11 a 50)</option>
            <option value="mediana">Mediana (51 a 200)</option>
            <option value="grande">Grande (más de 200)</option>
          </select>
        </label>
        <label className="field">
          <span>Ciudad</span>
          <input name="city" className="input" />
        </label>
        <label className="field md:col-span-2">
          <span>Sitio web</span>
          <input name="website" type="url" className="input" placeholder="https://" />
        </label>
        <label className="field md:col-span-2">
          <span>Descripción breve</span>
          <textarea name="description" className="input" placeholder="A qué se dedica la organización y qué tipo de practicantes busca." />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="is_public_entity" /> Es una entidad pública
        </label>
      </div>

      <div className="border-t border-borde pt-5">
        <h2 className="flex items-center gap-2 font-black text-azul-oscuro"><span className="icon-tile icon-tile-verde h-9 w-9"><UserRound className="!h-4 !w-4" /></span> Persona de contacto</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="field">
            <span>Nombre completo</span>
            <input name="contact_name" required className="input" />
          </label>
          <label className="field">
            <span>Cargo</span>
            <input name="position" className="input" />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input name="phone" type="tel" className="input" />
          </label>
          <label className="field">
            <span>Correo</span>
            <input value={defaultEmail} readOnly className="input bg-superficie" />
          </label>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] border border-azul/15 bg-celeste p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-azul" aria-hidden="true" />
        <input type="checkbox" name="terms" required className="mt-1" />
        <span>
          Acepto usar los datos de los estudiantes solo para seleccionar practicantes, no cederlos a terceros y eliminar los listados
          exportados al terminar el proceso. Conozco que cada consulta y exportación queda registrada.{" "}
          <Link href="/datos-personales" target="_blank" className="text-azul-medio underline">
            Tratamiento de datos personales
          </Link>
          .
        </span>
      </label>

      {error && <p className="text-sm text-naranja">{error}</p>}
      <button className="btn btn-primary" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Building2 />}
        {loading ? "Registrando…" : "Registrar organización"}
      </button>
    </form>
  );
}
