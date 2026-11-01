// Illustrations about connecting students (talent) with organizations. Pure SVG, animated with CSS.

function Person({ x, y, tone = "var(--azul)" }: { x: number; y: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="22" fill="#fff" stroke={tone} strokeWidth="2" />
      <circle cy="-6" r="7" fill={tone} />
      <path d="M-12 13c2-8 7-12 12-12s10 4 12 12" fill={tone} />
      <path d="M-9 -16l9-5 9 5-9 5z" fill="var(--verde)" />
    </g>
  );
}

function Building({ x, y, tone = "var(--azul-medio)" }: { x: number; y: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-22" y="-22" width="44" height="44" rx="10" ry="10" fill="#fff" stroke={tone} strokeWidth="2" />
      <rect x="-11" y="-12" width="22" height="26" rx="2" fill={tone} />
      {[-6, 2].map((wx) => [-7, 0, 7].map((wy) => <rect key={`${wx}${wy}`} x={wx} y={wy} width="4" height="4" fill="#fff" />))}
    </g>
  );
}

export function ConnectionNetwork({ className = "" }: { className?: string }) {
  const people = [
    [60, 70],
    [40, 170],
    [80, 270],
    [150, 120],
    [140, 230],
  ];
  const orgs = [
    [440, 80],
    [470, 190],
    [430, 290],
  ];
  const links: [number, number, boolean][] = [
    [0, 0, false],
    [3, 0, true],
    [3, 1, false],
    [1, 1, false],
    [4, 1, true],
    [4, 2, false],
    [2, 2, false],
  ];

  return (
    <svg viewBox="0 0 520 340" className={className} role="img" aria-label="Estudiantes conectados con organizaciones">
      <defs>
        <linearGradient id="cn-link" x1="0" x2="1">
          <stop offset="0" stopColor="var(--azul)" />
          <stop offset="1" stopColor="var(--verde)" />
        </linearGradient>
        <pattern id="cn-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="var(--azul)" opacity="0.12" />
        </pattern>
      </defs>
      <rect x="200" y="20" width="120" height="300" rx="60" fill="url(#cn-dots)" />
      {links.map(([p, o, strong], i) => {
        const [x1, y1] = people[p];
        const [x2, y2] = orgs[o];
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
      <g transform="translate(260 170)" className="match-pulse">
        <circle r="34" fill="var(--verde)" opacity="0.15" />
        <circle r="24" fill="var(--verde)" />
        <path d="M-9 0l6 6 12-13" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {people.map(([x, y], i) => (
        <Person key={i} x={x} y={y} tone={i % 2 ? "var(--azul-medio)" : "var(--azul)"} />
      ))}
      {orgs.map(([x, y], i) => (
        <Building key={i} x={x} y={y} tone={i === 1 ? "var(--azul-oscuro)" : "var(--azul-medio)"} />
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
