"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Loader2, Plus, Save, Send, Trash2, TriangleAlert, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DATE_MAX, DATE_MIN, isValidDate, MODALITY_LABEL, SKILL_LEVEL } from "@/lib/labels";
import { CONTRACT_LABEL, LANGUAGE_LEVELS, type CallLanguage, type CallStatus, type CallWithRelations, type ContractType } from "@/lib/calls";
import { CallLogo } from "@/components/call-card";
import { HelpTip } from "@/components/ui/help-tip";

type Option = { id: number; name: string };
type CompanyOption = { id: string; name: string; logo_url: string | null };
type SkillOption = { id: number; name: string; domain: string };

const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

// Logos are shown on white: a corner that is neither transparent nor near-white means the logo brings its own background
async function hasColoredBackground(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(bitmap, 0, 0);
    const points = [
      [1, 1],
      [bitmap.width - 2, 1],
      [1, bitmap.height - 2],
      [bitmap.width - 2, bitmap.height - 2],
    ];
    return points.some(([x, y]) => {
      const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
      return a > 20 && (r < 235 || g < 235 || b < 235);
    });
  } catch {
    return false;
  }
}

const text = (v: string | null | undefined) => v ?? "";
const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function CallForm({
  call,
  programs,
  skills,
  companies,
  defaultMinProgress,
}: {
  call: CallWithRelations | null;
  programs: Option[];
  skills: SkillOption[];
  companies: CompanyOption[];
  defaultMinProgress: number;
}) {
  const router = useRouter();
  const [f, setF] = useState({
    company_id: call?.company_id ?? "",
    company_name: text(call?.company_name),
    company_brand: text(call?.company_brand),
    title: text(call?.title),
    summary: text(call?.summary),
    openings: num(call?.openings ?? 1),
    start_date: text(call?.start_date),
    deadline: text(call?.deadline),
    profile: text(call?.profile),
    academic_requirement: text(call?.academic_requirement),
    enforce_requirements: call?.enforce_requirements ?? true,
    min_progress: call ? num(call.min_progress) : String(defaultMinProgress),
    min_papa: num(call?.min_papa),
    duties: text(call?.duties),
    knowledge: text(call?.knowledge),
    contract_type: (call?.contract_type ?? "") as ContractType | "",
    paid: call?.paid ?? false,
    stipend: num(call?.stipend),
    stipend_note: text(call?.stipend_note),
    duration_months: num(call?.duration_months ?? 6),
    schedule: text(call?.schedule),
    city: text(call?.city),
    modality: text(call?.modality),
    benefits: text(call?.benefits),
    extra_info: text(call?.extra_info),
  });
  const [programIds, setProgramIds] = useState<number[]>(call?.call_programs.map((p) => p.program_id) ?? []);
  const [callSkills, setCallSkills] = useState<{ skill_id: number; level: number }[]>(call?.call_skills.map((s) => ({ skill_id: s.skill_id, level: s.level })) ?? []);
  const [languages, setLanguages] = useState<CallLanguage[]>(call?.languages ?? []);
  const [skillPick, setSkillPick] = useState({ id: "", level: 1 });
  const [logo, setLogo] = useState<{ file: File; preview: string; warn: boolean } | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [busy, setBusy] = useState<CallStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const skillName = useMemo(() => Object.fromEntries(skills.map((s) => [s.id, s.name])), [skills]);
  const domains = useMemo(() => [...new Set(skills.map((s) => s.domain))], [skills]);
  const linked = companies.find((c) => c.id === f.company_id) ?? null;
  const currentLogo = logo?.preview ?? (removeLogo ? null : call?.logo_path ? `__existing__` : linked?.logo_url ?? null);

  async function pickLogo(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!LOGO_TYPES[file.type]) return setError("El logo debe ser PNG (recomendado, sin fondo), JPG o WebP.");
    if (file.size > 1024 * 1024) return setError("El logo supera 1 MB.");
    setLogo({ file, preview: URL.createObjectURL(file), warn: await hasColoredBackground(file) });
    setRemoveLogo(false);
  }

  function validate() {
    if (f.company_name.trim().length < 2) return "Escribe el nombre de la empresa.";
    if (f.title.trim().length < 3) return "Escribe el nombre de la práctica o del cargo.";
    if (!isValidDate(f.deadline)) return "Escribe una fecha límite válida.";
    if (f.start_date && !isValidDate(f.start_date)) return "La fecha de inicio no es válida.";
    if (f.min_progress && (Number(f.min_progress) < 0 || Number(f.min_progress) > 100)) return "El avance mínimo va de 0 a 100.";
    if (f.min_papa && (Number(f.min_papa) < 0 || Number(f.min_papa) > 5)) return "El PAPA mínimo va de 0,0 a 5,0.";
    if (languages.some((l) => !l.language.trim())) return "Escribe el nombre de cada idioma o quita la fila vacía.";
    return null;
  }

  async function save(status: CallStatus) {
    const invalid = validate();
    if (invalid) return setError(invalid);
    setBusy(status);
    setError(null);
    const supabase = createClient();
    const clean = (v: string) => v.trim() || null;
    const data = {
      status,
      company_id: f.company_id || null,
      company_name: f.company_name.trim(),
      company_brand: clean(f.company_brand),
      title: f.title.trim(),
      summary: clean(f.summary),
      openings: f.openings ? Number(f.openings) : null,
      start_date: f.start_date || null,
      deadline: f.deadline,
      profile: clean(f.profile),
      academic_requirement: clean(f.academic_requirement),
      enforce_requirements: f.enforce_requirements,
      min_progress: f.min_progress === "" ? null : Number(f.min_progress),
      min_papa: f.min_papa === "" ? null : Number(f.min_papa),
      duties: clean(f.duties),
      knowledge: clean(f.knowledge),
      languages: languages.map((l) => ({ language: l.language.trim(), level: l.level })),
      contract_type: f.contract_type || null,
      paid: f.paid,
      stipend: f.paid && f.stipend !== "" ? Number(f.stipend) : null,
      stipend_note: f.paid ? clean(f.stipend_note) : null,
      duration_months: f.duration_months ? Number(f.duration_months) : null,
      schedule: clean(f.schedule),
      city: clean(f.city),
      modality: f.modality || null,
      benefits: clean(f.benefits),
      extra_info: clean(f.extra_info),
    };
    const { data: id, error: e } = await supabase.rpc("save_call", { p_id: call?.id ?? null, p_data: data, p_programs: programIds, p_skills: callSkills });
    if (e || !id) {
      setBusy(null);
      return setError(/check constraint/.test(e?.message ?? "") ? "Algún campo supera el largo permitido o tiene un valor fuera de rango." : "No se pudo guardar. Inténtalo de nuevo.");
    }

    if (logo) {
      const path = `${id}/${Date.now()}.${LOGO_TYPES[logo.file.type]}`;
      const { error: up } = await supabase.storage.from("call-logos").upload(path, logo.file, { contentType: logo.file.type });
      if (up || (await supabase.from("calls").update({ logo_path: path }).eq("id", id)).error) {
        setBusy(null);
        return setError("La convocatoria se guardó, pero no se pudo subir el logo. Ábrela de nuevo e inténtalo otra vez.");
      }
      if (call?.logo_path) await supabase.storage.from("call-logos").remove([call.logo_path]);
    } else if (removeLogo && call?.logo_path) {
      await supabase.from("calls").update({ logo_path: null }).eq("id", id);
      await supabase.storage.from("call-logos").remove([call.logo_path]);
    }

    router.push(`/admin/convocatorias/${id}`);
    router.refresh();
  }

  const existingLogoUrl = call?.logo_path ? createClient().storage.from("call-logos").getPublicUrl(call.logo_path).data.publicUrl : null;
  const shownLogo = currentLogo === "__existing__" ? existingLogoUrl : currentLogo;

  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <h2 className="font-black text-azul-oscuro">Empresa</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">
            <span>
              Empresa registrada en Talento FCEN (opcional){" "}
              <HelpTip label="Empresa vinculada">Si la vinculas, esa empresa verá a los postulantes de esta convocatoria y su hoja de vida completa desde su cuenta.</HelpTip>
            </span>
            <select
              className="input"
              value={f.company_id}
              onChange={(e) => {
                const c = companies.find((x) => x.id === e.target.value);
                setF((prev) => ({ ...prev, company_id: e.target.value, company_name: prev.company_name || c?.name || "" }));
              }}
            >
              <option value="">Sin vincular</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Nombre de la empresa *</span>
            <input className="input" value={f.company_name} maxLength={160} onChange={(e) => set("company_name", e.target.value)} />
          </label>
          <label className="field">
            <span>Marca, sede o dependencia</span>
            <input className="input" value={f.company_brand} maxLength={160} placeholder="Por ejemplo, Aserrío A&M" onChange={(e) => set("company_brand", e.target.value)} />
          </label>
          <div className="field">
            <span>Logo</span>
            <div className="flex items-center gap-3">
              <CallLogo url={shownLogo} name={f.company_name || "la empresa"} />
              <div className="space-y-1">
                <label className="btn btn-secondary btn-sm cursor-pointer">
                  <ImageUp /> {shownLogo ? "Cambiar logo" : "Subir logo"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pickLogo(e.target.files?.[0])} />
                </label>
                {(logo || (call?.logo_path && !removeLogo)) && (
                  <button
                    type="button"
                    className="block text-xs text-suave hover:text-naranja"
                    onClick={() => {
                      setLogo(null);
                      setRemoveLogo(true);
                    }}
                  >
                    Quitar logo
                  </button>
                )}
                <small className="block text-xs text-suave">PNG sin fondo o con fondo blanco, máximo 1 MB.{linked?.logo_url && !call?.logo_path && !logo ? " Si no subes uno, se usa el de la empresa vinculada." : ""}</small>
              </div>
            </div>
            {logo?.warn && (
              <p className="flex items-start gap-1.5 text-xs text-naranja">
                <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Este logo parece tener un fondo de color. Para que todos se vean iguales, usa una versión sin fondo o con fondo blanco.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-black text-azul-oscuro">La práctica</h2>
        <label className="field">
          <span>Nombre de la práctica o del cargo *</span>
          <input className="input" value={f.title} maxLength={160} placeholder="Practicante de ingeniería de procesos" onChange={(e) => set("title", e.target.value)} />
        </label>
        <label className="field">
          <span>Resumen</span>
          <textarea className="input min-h-20" value={f.summary} maxLength={600} placeholder="Dos o tres líneas que aparecen en la tarjeta del listado." onChange={(e) => set("summary", e.target.value)} />
        </label>
        <fieldset className="field">
          <span>Programas a los que va dirigida</span>
          <div className="flex flex-wrap gap-2">
            {programs.map((p) => {
              const on = programIds.includes(p.id);
              return (
                <label key={p.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${on ? "border-azul bg-celeste font-black text-azul-oscuro" : "border-borde bg-white"}`}>
                  <input type="checkbox" checked={on} onChange={() => setProgramIds(on ? programIds.filter((x) => x !== p.id) : [...programIds, p.id])} />
                  {p.name}
                </label>
              );
            })}
          </div>
          <small>Si no marcas ninguno, la convocatoria queda abierta a todos los programas.</small>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="field">
            <span>Fecha límite de postulación *</span>
            <input type="date" className="input" min={DATE_MIN} max={DATE_MAX} value={f.deadline} onChange={(e) => set("deadline", e.target.value)} />
          </label>
          <label className="field">
            <span>Fecha aproximada de inicio</span>
            <input type="date" className="input" min={DATE_MIN} max={DATE_MAX} value={f.start_date} onChange={(e) => set("start_date", e.target.value)} />
          </label>
          <label className="field">
            <span>Practicantes requeridos</span>
            <input type="number" min={1} max={99} className="input" value={f.openings} onChange={(e) => set("openings", e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Perfil buscado</span>
          <textarea className="input min-h-24" value={f.profile} maxLength={2000} onChange={(e) => set("profile", e.target.value)} />
        </label>
        <label className="field">
          <span>Funciones (una por línea)</span>
          <textarea className="input min-h-32" value={f.duties} maxLength={4000} onChange={(e) => set("duties", e.target.value)} />
        </label>
      </section>

      <section className="card space-y-4">
        <h2 className="font-black text-azul-oscuro">Requisitos académicos</h2>
        <label className="flex items-start gap-3 rounded-lg bg-celeste p-3 text-sm">
          <input type="checkbox" className="mt-1" checked={f.enforce_requirements} onChange={(e) => set("enforce_requirements", e.target.checked)} />
          <span>
            <strong className="text-azul-oscuro">Exigir los requisitos de la carrera para postularse</strong>
            <span className="block text-suave">
              Solo podrán postularse estudiantes de los programas marcados que cumplan el avance y el PAPA mínimos. Si lo desactivas, cualquier estudiante con la hoja de vida mínima puede postularse y la Facultad ve
              quién cumple.
            </span>
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Avance mínimo del plan de estudios (%)</span>
            <input type="number" min={0} max={100} step="0.1" className="input" value={f.min_progress} onChange={(e) => set("min_progress", e.target.value)} />
            <small>Déjalo vacío si no aplica.</small>
          </label>
          <label className="field">
            <span>PAPA mínimo</span>
            <input type="number" min={0} max={5} step="0.1" className="input" value={f.min_papa} onChange={(e) => set("min_papa", e.target.value)} />
            <small>Déjalo vacío si no aplica (N/A).</small>
          </label>
        </div>
        <label className="field">
          <span>Otros requisitos académicos</span>
          <textarea
            className="input min-h-20"
            value={f.academic_requirement}
            maxLength={1200}
            placeholder="Por ejemplo: tener aprobados todos los créditos de fundamentación para el periodo 2027-1S."
            onChange={(e) => set("academic_requirement", e.target.value)}
          />
        </label>
      </section>

      <section className="card space-y-4">
        <h2 className="font-black text-azul-oscuro">Conocimientos e idiomas</h2>
        <div className="field">
          <span>Habilidades del catálogo</span>
          {callSkills.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {callSkills.map((s) => (
                <li key={s.skill_id} className="chip">
                  {skillName[s.skill_id]} · {SKILL_LEVEL[s.level]}
                  <button type="button" aria-label={`Quitar ${skillName[s.skill_id]}`} onClick={() => setCallSkills(callSkills.filter((x) => x.skill_id !== s.skill_id))}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <select className="input max-w-sm flex-1" value={skillPick.id} onChange={(e) => setSkillPick({ ...skillPick, id: e.target.value })}>
              <option value="">Elige una habilidad</option>
              {domains.map((d) => (
                <optgroup key={d} label={d}>
                  {skills
                    .filter((s) => s.domain === d && !callSkills.some((c) => c.skill_id === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <select className="input w-36" value={skillPick.level} onChange={(e) => setSkillPick({ ...skillPick, level: Number(e.target.value) })}>
              {[1, 2, 3].map((l) => (
                <option key={l} value={l}>
                  {SKILL_LEVEL[l]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={!skillPick.id}
              onClick={() => {
                setCallSkills([...callSkills, { skill_id: Number(skillPick.id), level: skillPick.level }]);
                setSkillPick({ id: "", level: 1 });
              }}
            >
              <Plus /> Agregar
            </button>
          </div>
        </div>
        <label className="field">
          <span>Otros conocimientos requeridos o deseables (uno por línea)</span>
          <textarea className="input min-h-24" value={f.knowledge} maxLength={3000} placeholder="Excel intermedio&#10;Norma ISO 9001:2015 (básico)" onChange={(e) => set("knowledge", e.target.value)} />
        </label>
        <div className="field">
          <span>Idiomas</span>
          {languages.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input className="input flex-1" value={l.language} placeholder="Inglés" onChange={(e) => setLanguages(languages.map((x, j) => (j === i ? { ...x, language: e.target.value } : x)))} />
              <select className="input w-28" value={l.level} onChange={(e) => setLanguages(languages.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)))}>
                {LANGUAGE_LEVELS.map((lv) => (
                  <option key={lv}>{lv}</option>
                ))}
              </select>
              <button type="button" className="btn btn-ghost btn-sm" aria-label="Quitar idioma" onClick={() => setLanguages(languages.filter((_, j) => j !== i))}>
                <Trash2 />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => setLanguages([...languages, { language: languages.length ? "" : "Inglés", level: "A2" }])}>
            <Plus /> Agregar idioma
          </button>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-black text-azul-oscuro">Condiciones</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Tipo de vinculación</span>
            <select className="input" value={f.contract_type} onChange={(e) => set("contract_type", e.target.value as ContractType | "")}>
              <option value="">Sin definir</option>
              {(Object.keys(CONTRACT_LABEL) as ContractType[]).map((k) => (
                <option key={k} value={k}>
                  {CONTRACT_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Duración (meses)</span>
            <input type="number" min={1} max={24} className="input" value={f.duration_months} onChange={(e) => set("duration_months", e.target.value)} />
          </label>
        </div>
        <label className="flex items-center gap-3 text-sm font-black text-azul-oscuro">
          <input type="checkbox" checked={f.paid} onChange={(e) => set("paid", e.target.checked)} /> Tiene apoyo económico
        </label>
        {f.paid && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Valor mensual (pesos)</span>
              <input type="number" min={0} step={1} className="input" value={f.stipend} placeholder="1750905" onChange={(e) => set("stipend", e.target.value)} />
            </label>
            <label className="field">
              <span>Detalle del apoyo</span>
              <input className="input" value={f.stipend_note} maxLength={300} placeholder="Más auxilio de transporte" onChange={(e) => set("stipend_note", e.target.value)} />
            </label>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="field">
            <span>Lugar</span>
            <input className="input" value={f.city} maxLength={120} placeholder="Manizales (Caldas)" onChange={(e) => set("city", e.target.value)} />
          </label>
          <label className="field">
            <span>Modalidad</span>
            <select className="input" value={f.modality} onChange={(e) => set("modality", e.target.value)}>
              <option value="">Sin definir</option>
              {Object.entries(MODALITY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Horario</span>
            <input className="input" value={f.schedule} maxLength={300} placeholder="Lunes a viernes, 7:00 a. m. a 4:00 p. m." onChange={(e) => set("schedule", e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Otros beneficios</span>
          <textarea className="input min-h-20" value={f.benefits} maxLength={1500} onChange={(e) => set("benefits", e.target.value)} />
        </label>
        <label className="field">
          <span>Más información</span>
          <textarea className="input min-h-20" value={f.extra_info} maxLength={1500} placeholder="Contacto de la Oficina de Prácticas, documentos que debe tener listos el estudiante…" onChange={(e) => set("extra_info", e.target.value)} />
        </label>
      </section>

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-borde bg-white/95 p-3 shadow-lg backdrop-blur lg:bottom-4">
        <button type="button" onClick={() => save("publicada")} disabled={!!busy} className="btn btn-accent">
          {busy === "publicada" ? <Loader2 className="animate-spin" /> : <Send />} {call?.status === "publicada" ? "Guardar cambios" : "Publicar"}
        </button>
        <button type="button" onClick={() => save(call?.status === "cerrada" ? "cerrada" : "borrador")} disabled={!!busy} className="btn btn-secondary">
          {busy === "borrador" || busy === "cerrada" ? <Loader2 className="animate-spin" /> : <Save />}{" "}
          {call?.status === "publicada" ? "Pasar a borrador" : call?.status === "cerrada" ? "Guardar (sigue cerrada)" : "Guardar borrador"}
        </button>
        {error && (
          <p role="alert" className="text-sm text-naranja">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
