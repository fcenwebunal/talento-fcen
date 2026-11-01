import { UserRound } from "lucide-react";

const PALETTES = [
  ["#13477c", "#0c6896"],
  ["#0b2e59", "#13477c"],
  ["#3f6a00", "#7ab317"],
  ["#0c6896", "#3fa3c9"],
  ["#8a5d00", "#ecb01b"],
  ["#c1390a", "#e0662e"],
];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string | null | undefined) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({
  name,
  seed,
  src,
  size = 48,
  square = false,
}: {
  name?: string | null;
  seed: string;
  src?: string | null;
  size?: number;
  square?: boolean;
}) {
  const [from, to] = PALETTES[hash(seed) % PALETTES.length];
  const radius = square ? "0.875rem 0.875rem 0.875rem 0.1875rem" : "999px";
  const text = initials(name);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name ?? ""} width={size} height={size} className="shrink-0 object-cover" style={{ width: size, height: size, borderRadius: radius }} />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden font-black text-white"
      style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(135deg, ${from}, ${to})`, fontSize: size * 0.36 }}
    >
      <span className="absolute -right-[20%] -top-[20%] h-[70%] w-[70%] rounded-full bg-white/10" />
      {text ? <span className="relative">{text}</span> : <UserRound className="relative" style={{ width: size * 0.5, height: size * 0.5 }} />}
    </span>
  );
}
