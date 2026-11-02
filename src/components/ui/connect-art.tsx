// Illustrations about connecting students (talent) with organizations. Pure SVG, animated with CSS.
import { Handshake } from "lucide-react";

type Look = "bun" | "cap" | "hat" | "long" | "curly" | "grad";

const HAIR = { dark: "#2a2433", brown: "#5b3a26", black: "#141420" };

function Person({ x, y, look, skin, shirt, id }: { x: number; y: number; look: Look; skin: string; shirt: string; id: string }) {
  const hair = look === "long" ? HAIR.brown : look === "curly" ? HAIR.black : HAIR.dark;
  return (
    <g transform={`translate(${x} ${y})`}>
      <clipPath id={id}>
        <circle r="20.5" />
      </clipPath>
      <circle r="22" fill="#fff" stroke={shirt} strokeWidth="2" />
      <g clipPath={`url(#${id})`}>
        {look === "long" && <path d="M-8.6 -4C-8.6 -12-4.6 -13.6 0 -13.6S8.6 -12 8.6 -4L9.4 9C6 10.6-6 10.6-9.4 9Z" fill={hair} />}
        <path d="M-15 24c0-10 6.5-15.5 15-15.5S15 14 15 24Z" fill={shirt} />
        <rect x="-2.6" y="1.5" width="5.2" height="6" rx="2" fill={skin} />
        <circle cy="-4" r="7" fill={skin} />
        {look === "long" && <path d="M-7.2 -5.6C-6.4 -11.2 6.4 -11.2 7.2 -5.6 4.6 -8.6-1.4 -9-7.2 -5.6Z" fill={hair} />}
        {look === "bun" && (
          <>
            <circle cy="-13.4" r="3.6" fill={hair} />
            <path d="M-7.6 -2.4C-8.6 -12.2-3 -12.9 0 -12.9S8.6 -12.2 7.6 -2.4C6.6 -7.2 4 -8.6 0 -8.6S-6.6 -7.2-7.6 -2.4Z" fill={hair} />
            <circle cx="-7.4" cy="-1" r="1.3" fill="var(--verde)" />
          </>
        )}
        {look === "curly" && (
          <>
            {[[-6.4, -7.6], [-3.8, -10.8], [0, -11.9], [3.8, -10.8], [6.4, -7.6], [-7.6, -4], [7.6, -4]].map(([cx, cy]) => (
              <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="3.1" fill={hair} />
            ))}
            <g fill="none" stroke="var(--azul-oscuro)" strokeWidth="1.1">
              <circle cx="-3" cy="-3.6" r="2.3" />
              <circle cx="3" cy="-3.6" r="2.3" />
              <path d="M-0.7 -3.8h1.4" />
            </g>
          </>
        )}
        {look === "cap" && (
          <>
            <path d="M-7.4 -5.4C-7.4 -12.8 7.4 -12.8 7.4 -5.4Z" fill="var(--verde)" />
            <path d="M3 -6.4h8.6c1.4 0 1.4 2 0 2H3Z" fill="var(--verde-tinta)" />
            <circle cy="-12" r="1.1" fill="var(--verde-tinta)" />
          </>
        )}
        {look === "hat" && (
          <>
            <path d="M-7.2 -5.2C-7.4 -8-5.6 -9.4 0 -9.4S7.4 -8 7.2 -5.2C5 -7-5 -7-7.2 -5.2Z" fill={hair} />
            <path d="M-6.4 -9.6C-6.6 -15.6 6.6 -15.6 6.4 -9.6Z" fill="#f4ebd3" stroke="#8a6a3a" strokeWidth="0.8" />
            <rect x="-6.5" y="-11.4" width="13" height="2" fill="var(--azul-oscuro)" />
            <ellipse cy="-9.4" rx="12.5" ry="2.7" fill="#f4ebd3" stroke="#8a6a3a" strokeWidth="0.8" />
          </>
        )}
        {look === "grad" && (
          <path d="M-7.2 -5.4C-7.5 -10.4-3.6 -11.6 0 -11.6S7.5 -10.4 7.2 -5.4C5 -8 2 -8.6 0 -8.6S-5 -8-7.2 -5.4Z" fill={hair} />
        )}
      </g>
      {look === "grad" && (
        <>
          <path d="M-11 -13.4l11 -5.2 11 5.2-11 5.2Z" fill="var(--verde)" />
          <path d="M8 -12.2v6.4" stroke="var(--verde-tinta)" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

type Kind = "tower" | "house" | "factory" | "road";

function Organization({ x, y, kind, tone }: { x: number; y: number; kind: Kind; tone: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-22" y="-22" width="44" height="44" rx="10" fill="#fff" stroke={tone} strokeWidth="2" />
      {kind === "tower" && (
        <>
          <rect x="-11" y="-13" width="22" height="27" rx="2" fill={tone} />
          {[-6, 2].map((wx) => [-8, -1, 6].map((wy) => <rect key={`${wx}${wy}`} x={wx} y={wy} width="4" height="4" fill="#fff" />))}
        </>
      )}
      {kind === "house" && (
        <>
          <path d="M-9 0v13h18V0" fill={tone} />
          <path d="M-13 2 0 -11 13 2" fill="none" stroke={tone} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="5" y="-10" width="3.4" height="6" fill={tone} />
          <rect x="-2.6" y="5" width="5.2" height="8" rx="1" fill="#fff" />
          <rect x="-7" y="2" width="3.6" height="3.6" fill="#fff" />
          <rect x="3.4" y="2" width="3.6" height="3.6" fill="var(--verde)" />
        </>
      )}
      {kind === "factory" && (
        <>
          <circle cx="9" cy="-16" r="2.2" fill={tone} className="smoke" />
          <circle cx="11" cy="-17" r="1.7" fill={tone} className="smoke" style={{ animationDelay: "1.2s" }} />
          <rect x="6.8" y="-13" width="4.4" height="14" fill={tone} />
          <path d="M-13 14V-1l7-5v5l7-5v5l7-5v20Z" fill={tone} />
          {[-9, -2, 5].map((wx) => (
            <rect key={wx} x={wx} y="5" width="3.6" height="3.6" fill="#fff" />
          ))}
        </>
      )}
      {kind === "road" && (
        <>
          <path d="M-4.6 -13h9.2l8.6 27h-26.4Z" fill={tone} />
          <path d="M0 -11v24" stroke="#fff" strokeWidth="1.8" strokeDasharray="3.4 3" className="road-dash" />
        </>
      )}
    </g>
  );
}

const PEOPLE: { x: number; y: number; look: Look; skin: string; shirt: string }[] = [
  { x: 58, y: 48, look: "bun", skin: "#f1c9a5", shirt: "var(--azul)" },
  { x: 150, y: 98, look: "cap", skin: "#c68b63", shirt: "var(--azul-medio)" },
  { x: 54, y: 152, look: "hat", skin: "#e2b28a", shirt: "var(--azul-oscuro)" },
  { x: 150, y: 204, look: "long", skin: "#a8714e", shirt: "var(--azul)" },
  { x: 58, y: 256, look: "curly", skin: "#d9a47c", shirt: "var(--azul-medio)" },
  { x: 150, y: 300, look: "grad", skin: "#f1c9a5", shirt: "var(--azul-oscuro)" },
];

const ORGS: { x: number; y: number; kind: Kind }[] = [
  { x: 426, y: 56, kind: "tower" },
  { x: 514, y: 136, kind: "house" },
  { x: 426, y: 216, kind: "factory" },
  { x: 514, y: 294, kind: "road" },
];

// [person, organization, strong]. Each handshake sits at the curve's midpoint, which for this symmetric cubic is the average of both ends.
const LINKS: [number, number, boolean][] = [
  [0, 0, false],
  [1, 0, true],
  [1, 1, false],
  [2, 1, false],
  [2, 2, true],
  [3, 3, false],
  [4, 2, false],
  [5, 3, true],
];

export function ConnectionNetwork({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 540 340" className={className} role="img" aria-label="Estudiantes conectados con organizaciones">
      <defs>
        <linearGradient id="cn-link" x1="0" x2="1">
          <stop offset="0" stopColor="var(--azul)" />
          <stop offset="1" stopColor="var(--verde)" />
        </linearGradient>
        <linearGradient id="cn-word" x1="0" x2="1">
          <stop offset="0" stopColor="var(--azul-oscuro)" stopOpacity="0" />
          <stop offset="0.3" stopColor="var(--azul-oscuro)" stopOpacity="0.05" />
          <stop offset="0.7" stopColor="var(--azul-oscuro)" stopOpacity="0.05" />
          <stop offset="1" stopColor="var(--azul-oscuro)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="display" fill="url(#cn-word)" fontSize="32" letterSpacing="2" textAnchor="middle" dominantBaseline="central" aria-hidden="true">
        <text transform="translate(104 174) rotate(-90)">ESTUDIANTES</text>
        <text transform="translate(470 175) rotate(90)">ORGANIZACIONES</text>
      </g>
      {LINKS.map(([p, o, strong], i) => {
        const { x: x1, y: y1 } = PEOPLE[p];
        const { x: x2, y: y2 } = ORGS[o];
        const d = `M${x1 + 22} ${y1} C ${x1 + 150} ${y1}, ${x2 - 150} ${y2}, ${x2 - 22} ${y2}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="var(--borde)" strokeWidth="2" />
            <path
              d={d}
              fill="none"
              stroke="url(#cn-link)"
              strokeWidth={strong ? 3 : 2}
              strokeLinecap="round"
              strokeDasharray={strong ? "10 10" : "4 12"}
              className="flow-dash"
              style={{ animationDuration: `${strong ? 2.4 : 4}s`, opacity: strong ? 1 : 0.55 }}
            />
          </g>
        );
      })}
      {LINKS.map(([p, o, strong], i) => (
        <g key={i} transform={`translate(${(PEOPLE[p].x + ORGS[o].x) / 2} ${(PEOPLE[p].y + ORGS[o].y) / 2})`}>
          <g className="hand-pop" style={{ animationDelay: `${(i * 0.35).toFixed(2)}s` }}>
            {strong && <circle r="17" fill="var(--verde)" opacity="0.18" />}
            <circle r="12.5" fill={strong ? "var(--verde)" : "#fff"} stroke={strong ? "#fff" : "var(--verde)"} strokeWidth="2" />
            <Handshake x={-7.5} y={-7.5} width={15} height={15} color={strong ? "#fff" : "var(--verde-tinta)"} strokeWidth={2.2} aria-hidden="true" />
          </g>
        </g>
      ))}
      {PEOPLE.map((person, i) => (
        <Person key={i} id={`cn-p${i}`} {...person} />
      ))}
      {ORGS.map((org, i) => (
        <Organization key={i} {...org} tone={i % 2 ? "var(--azul-oscuro)" : "var(--azul-medio)"} />
      ))}
    </svg>
  );
}

export function PuzzleMatch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden="true">
      <g className="puzzle-left">
        <path d="M20 30h50v18a10 10 0 1 1 0 20v42H20z" fill="var(--azul)" />
        <circle cx="45" cy="60" r="9" fill="#fff" opacity="0.9" />
        <path d="M37 76c2-5 5-7 8-7s6 2 8 7" fill="#fff" opacity="0.9" />
      </g>
      <g className="puzzle-right">
        <path d="M70 30h70v80H70V68a10 10 0 1 0 0-20z" fill="var(--verde)" />
        <rect x="95" y="52" width="22" height="30" rx="2" fill="#fff" opacity="0.9" />
        <rect x="100" y="58" width="4" height="4" fill="var(--verde)" />
        <rect x="108" y="58" width="4" height="4" fill="var(--verde)" />
        <rect x="100" y="66" width="4" height="4" fill="var(--verde)" />
        <rect x="108" y="66" width="4" height="4" fill="var(--verde)" />
      </g>
    </svg>
  );
}

export function CvToOrg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 120" className={className} aria-hidden="true">
      <g transform="translate(16 14)">
        <rect width="64" height="86" rx="8" fill="#fff" stroke="var(--azul)" strokeWidth="2" />
        <circle cx="20" cy="22" r="8" fill="var(--azul)" />
        <rect x="34" y="16" width="22" height="4" rx="2" fill="var(--azul)" opacity="0.6" />
        <rect x="34" y="25" width="16" height="4" rx="2" fill="var(--azul)" opacity="0.3" />
        {[42, 52, 62, 72].map((y, i) => (
          <rect key={y} x="12" y={y} width={i % 2 ? 30 : 40} height="4" rx="2" fill="var(--borde)" />
        ))}
        <rect x="12" y="42" width="14" height="4" rx="2" fill="var(--verde)" />
      </g>
      <path d="M90 57h56" stroke="var(--borde)" strokeWidth="3" strokeLinecap="round" />
      <path d="M90 57h56" stroke="var(--verde)" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8" className="flow-dash" />
      <path d="M140 49l9 8-9 8" fill="none" stroke="var(--verde)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(160 18)">
        <rect width="64" height="80" rx="12" fill="var(--azul-oscuro)" />
        <rect x="18" y="16" width="28" height="44" rx="3" fill="#fff" opacity="0.95" />
        {[24, 34, 44].map((y) => [24, 36].map((x) => <rect key={`${x}${y}`} x={x} y={y} width="5" height="5" fill="var(--azul-oscuro)" />))}
        <circle cx="54" cy="10" r="10" fill="var(--verde)" />
        <path d="M49 10l3 3 6-6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function LinkPattern({ className = "" }: { className?: string }) {
  return <div className={`bg-links pointer-events-none ${className}`} aria-hidden="true" />;
}
