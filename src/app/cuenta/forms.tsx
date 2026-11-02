"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Camera, CheckCircle2, ImageUp, Loader2, Save, TriangleAlert, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { ImageCropper } from "@/components/ui/image-cropper";

type Status = { tone: "ok" | "error"; text: string } | null;

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p className={`flex items-center gap-2 text-sm font-black ${status.tone === "ok" ? "text-verde-tinta" : "text-naranja"}`} style={{ animation: "pop 0.35s var(--ease-out) both" }} role="status">
      {status.tone === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
      {status.text}
    </p>
  );
}

async function uploadImage(bucket: string, folder: string, file: File) {
  if (file.size > 2 * 1024 * 1024) throw new Error("La imagen supera los 2 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${folder}/${Date.now()}.${ext}`;
  // No upsert: it needs a SELECT policy these buckets don't have, and the timestamped path is always new.
  const { error } = await createClient().storage.from(bucket).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

export function AccountForm({
  userId,
  email,
  initial,
  avatarUrl,
  positionLabel,
}: {
  userId: string;
  email: string;
  initial: { full_name: string; position: string; bio: string };
  avatarUrl: string | null;
  positionLabel: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [preview, setPreview] = useState(avatarUrl);
  const [cropping, setCropping] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function changePhoto(file: File) {
    setStatus(null);
    try {
      const path = await uploadImage("avatars", userId, file);
      const { error } = await createClient().from("profiles").update({ avatar_path: path }).eq("id", userId);
      if (error) throw error;
      setPreview(URL.createObjectURL(file));
      setStatus({ tone: "ok", text: "Foto actualizada." });
      router.refresh();
    } catch (e) {
      setStatus({ tone: "error", text: e instanceof Error ? e.message : "No se pudo subir la foto." });
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const { error } = await createClient()
      .from("profiles")
      .update({ full_name: form.full_name.trim() || null, position: form.position.trim() || null, bio: form.bio.trim() || null })
      .eq("id", userId);
    setSaving(false);
    setStatus(error ? { tone: "error", text: error.message } : { tone: "ok", text: "Datos guardados." });
    if (!error) router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-5 p-6">
      <h2 className="flex items-center gap-2 font-black text-azul-oscuro">
        <UserRound className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Mi perfil
      </h2>
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar name={form.full_name || email} seed={email} src={preview} size={104} />
          <label className="absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-azul text-white shadow-md transition-transform hover:scale-105" title="Cambiar foto">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) setCropping(e.target.files[0]); e.target.value = ""; }} />
          </label>
          {cropping && <ImageCropper file={cropping} onCancel={() => setCropping(null)} onCrop={async (f) => { setCropping(null); await changePhoto(f); }} />}
        </div>
        <div className="text-sm text-suave">
          <p className="font-black text-texto">{email}</p>
          <p>JPG, PNG o WebP de hasta 2 MB.</p>
        </div>
      </div>
      <label className="field">
        <span>Nombre completo</span>
        <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </label>
      <label className="field">
        <span>{positionLabel}</span>
        <input className="input" maxLength={120} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
      </label>
      <label className="field">
        <span>Descripción</span>
        <textarea className="input" maxLength={600} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <small>{form.bio.length} de 600 caracteres</small>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Guardar
        </button>
        <StatusLine status={status} />
      </div>
    </form>
  );
}

type Company = {
  id: string;
  name: string;
  nit: string;
  sector: string | null;
  size: string | null;
  city: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
};

export function CompanyEditForm({ company }: { company: Company }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: company.name,
    sector: company.sector ?? "",
    size: company.size ?? "",
    city: company.city ?? "",
    website: company.website ?? "",
    description: company.description ?? "",
  });
  const [logo, setLogo] = useState(company.logo_url);
  const [cropping, setCropping] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const set = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  async function changeLogo(file: File) {
    setStatus(null);
    try {
      const path = await uploadImage("logos", company.id, file);
      const { error } = await createClient().from("companies").update({ logo_path: path }).eq("id", company.id);
      if (error) throw error;
      setLogo(URL.createObjectURL(file));
      setStatus({ tone: "ok", text: "Logo actualizado." });
      router.refresh();
    } catch (e) {
      setStatus({ tone: "error", text: e instanceof Error ? e.message : "No se pudo subir el logo." });
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const { error } = await createClient()
      .from("companies")
      .update({
        name: form.name.trim(),
        sector: form.sector || null,
        size: form.size || null,
        city: form.city || null,
        website: form.website || null,
        description: form.description || null,
      })
      .eq("id", company.id);
    setSaving(false);
    setStatus(error ? { tone: "error", text: error.message } : { tone: "ok", text: "Datos de la empresa guardados." });
    if (!error) router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-5 p-6">
      <h2 className="flex items-center gap-2 font-black text-azul-oscuro">
        <Building2 className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Mi empresa
      </h2>
      <div className="flex items-center gap-5">
        <Avatar name={form.name} seed={company.id} src={logo} size={96} square />
        <label className="btn btn-secondary cursor-pointer">
          <ImageUp /> Cambiar logo
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) setCropping(e.target.files[0]); e.target.value = ""; }} />
        </label>
        {cropping && <ImageCropper file={cropping} round={false} onCancel={() => setCropping(null)} onCrop={async (f) => { setCropping(null); await changeLogo(f); }} />}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field md:col-span-2">
          <span>Razón social</span>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="field">
          <span>NIT</span>
          <input className="input bg-superficie" value={company.nit} readOnly title="Para cambiar el NIT escríbale a la Facultad" />
        </label>
        <label className="field">
          <span>Sector</span>
          <input className="input" value={form.sector} onChange={(e) => set("sector", e.target.value)} />
        </label>
        <label className="field">
          <span>Tamaño</span>
          <select className="input" value={form.size} onChange={(e) => set("size", e.target.value)}>
            <option value="">Elegir…</option>
            <option value="micro">Microempresa</option>
            <option value="pequena">Pequeña</option>
            <option value="mediana">Mediana</option>
            <option value="grande">Grande</option>
          </select>
        </label>
        <label className="field">
          <span>Ciudad</span>
          <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </label>
        <label className="field md:col-span-2">
          <span>Sitio web</span>
          <input className="input" type="url" value={form.website} onChange={(e) => set("website", e.target.value)} />
        </label>
        <label className="field md:col-span-2">
          <span>Descripción</span>
          <textarea className="input" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Guardar empresa
        </button>
        <StatusLine status={status} />
      </div>
    </form>
  );
}
