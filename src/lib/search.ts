export type SearchParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]).filter(Boolean);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export const PAGE_SIZE = 24;

export function filtersFrom(params: SearchParams) {
  const page = Math.max(1, Number(one(params.pagina)) || 1);
  return {
    q: one(params.q),
    program_ids: list(params.programa).map(Number),
    levels: ["pregrado"],
    skill_ids: list(params.habilidad).map(Number),
    require_all_skills: one(params.todas) === "1",
    min_skill_level: Number(one(params.nivel_habilidad)) || 1,
    area_ids: list(params.area).map(Number),
    modality: one(params.modalidad),
    city: one(params.ciudad),
    language: one(params.idioma),
    include_unlisted: one(params.todos) === "1",
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    page,
  };
}

export function toQuery(params: SearchParams, overrides: Record<string, string | null> = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const v of list(value)) qs.append(key, v);
  }
  for (const [key, value] of Object.entries(overrides)) {
    qs.delete(key);
    if (value !== null) qs.set(key, value);
  }
  return qs.toString();
}
