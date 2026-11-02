import { SUPABASE_URL } from "@/lib/config";

export function skillIconUrl(path: string | null | undefined) {
  return path ? `${SUPABASE_URL}/storage/v1/object/public/skill-icons/${path}` : null;
}

// Rendered as an <img> so an uploaded SVG never runs inside the page
export function SkillIcon({ path, className = "h-3.5 w-3.5" }: { path: string | null | undefined; className?: string }) {
  const src = skillIconUrl(path);
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" aria-hidden="true" className={`shrink-0 ${className}`} loading="lazy" />;
}
