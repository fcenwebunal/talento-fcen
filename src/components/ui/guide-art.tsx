import {
  BadgeCheck, Banknote, BookOpen, Briefcase, Building2, CalendarDays, CircleHelp, ClipboardCheck, Clock, Coins, Eye, EyeOff,
  FileText, Flag, GraduationCap, Handshake, HeartHandshake, Hourglass, Library, Lightbulb, ListChecks, Lock, MapPin,
  MessagesSquare, Network, Route, Scale, Search, ShieldCheck, Sparkles, Star, Tag, Trophy, UserRound, UserRoundCheck, Users,
  type LucideIcon,
} from "lucide-react";

type Art = { main: LucideIcon; a: LucideIcon; b: LucideIcon; tone?: "azul" | "verde" };

const ARTS: Record<string, Art> = {
  "que-es": { main: Briefcase, a: GraduationCap, b: Building2 },
  "mi-carrera": { main: GraduationCap, a: BookOpen, b: FileText, tone: "verde" },
  listo: { main: ListChecks, a: BadgeCheck, b: UserRoundCheck },
  cuando: { main: CalendarDays, a: Clock, b: Search, tone: "verde" },
  ruta: { main: Route, a: Flag, b: MapPin },
  vinculacion: { main: Handshake, a: FileText, b: Building2, tone: "verde" },
  derechos: { main: ShieldCheck, a: Scale, b: HeartHandshake },
  pago: { main: Coins, a: Banknote, b: Handshake, tone: "verde" },
  destacar: { main: Sparkles, a: Star, b: Trophy },
  datos: { main: Lock, a: Eye, b: EyeOff, tone: "verde" },
  preguntas: { main: MessagesSquare, a: CircleHelp, b: Lightbulb },
  glosario: { main: Library, a: Tag, b: BookOpen, tone: "verde" },
  "como-funciona": { main: Network, a: Search, b: BadgeCheck },
  talento: { main: Users, a: Sparkles, b: GraduationCap, tone: "verde" },
  requisitos: { main: ClipboardCheck, a: ShieldCheck, b: UserRound },
  tiempos: { main: Hourglass, a: CalendarDays, b: Clock },
};

export function GuideArt({ id, className = "" }: { id: string; className?: string }) {
  const art = ARTS[id];
  if (!art) return null;
  const { main: Main, a: A, b: B } = art;
  const green = art.tone === "verde";

  return (
    <div className={`relative h-28 w-40 shrink-0 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 160 112" className="absolute inset-0 h-full w-full">
        <path d="M24 64c0-30 24-50 58-50s56 18 56 46-22 44-58 44S24 94 24 64z" fill={green ? "var(--verde-claro)" : "var(--celeste)"} />
        <circle cx="80" cy="58" r="46" fill="none" stroke={green ? "var(--verde)" : "var(--azul)"} strokeOpacity="0.25" strokeDasharray="3 7" />
        <path d="M44 28 L80 58 L128 84" fill="none" stroke={green ? "var(--verde)" : "var(--azul-medio)"} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 5" className="flow-dash" />
        <circle cx="140" cy="22" r="4" fill="var(--verde)" />
        <rect x="14" y="88" width="8" height="8" rx="2" fill={green ? "var(--azul)" : "var(--verde)"} opacity="0.6" />
      </svg>
      <span
        className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.125rem_1.125rem_1.125rem_0.25rem] text-white shadow-lg ${green ? "bg-[linear-gradient(135deg,var(--verde-tinta),var(--verde))]" : "bg-[linear-gradient(135deg,var(--azul),var(--azul-oscuro))]"}`}
      >
        <Main className="h-8 w-8" />
      </span>
      <span className="animate-float absolute left-4 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-borde bg-white text-azul shadow-md">
        <A className="h-5 w-5" />
      </span>
      <span className="animate-float absolute bottom-1 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-borde bg-white text-verde-tinta shadow-md" style={{ animationDelay: "1.6s" }}>
        <B className="h-5 w-5" />
      </span>
    </div>
  );
}
