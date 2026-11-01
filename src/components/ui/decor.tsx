export function Rings({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={`pointer-events-none ${className}`} aria-hidden="true">
      <g fill="none" stroke="currentColor">
        <circle cx="200" cy="200" r="198" strokeOpacity="0.18" />
        <circle cx="200" cy="200" r="150" strokeOpacity="0.14" strokeDasharray="4 10" />
        <circle cx="200" cy="200" r="100" strokeOpacity="0.12" />
        <circle cx="200" cy="200" r="50" strokeOpacity="0.1" strokeDasharray="2 6" />
      </g>
      <circle cx="350" cy="200" r="6" fill="currentColor" fillOpacity="0.5" />
      <circle cx="200" cy="50" r="4" fill="currentColor" fillOpacity="0.35" />
    </svg>
  );
}

export function Constellation({ className = "" }: { className?: string }) {
  const points = [
    [20, 40], [90, 20], [150, 70], [220, 30], [280, 90], [200, 140], [110, 120], [40, 160], [260, 180],
  ];
  const links = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [6, 0], [6, 7], [5, 8], [4, 8]];
  return (
    <svg viewBox="0 0 300 200" className={`pointer-events-none ${className}`} aria-hidden="true">
      <g stroke="currentColor" strokeOpacity="0.25" strokeWidth="1">
        {links.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={points[a][0]} y1={points[a][1]} x2={points[b][0]} y2={points[b][1]} />
        ))}
      </g>
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4 : 2.5} fill="currentColor" fillOpacity={i % 3 === 0 ? 0.7 : 0.4} />
      ))}
    </svg>
  );
}

export function CornerLines({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`pointer-events-none ${className}`} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={i * 20} y1="0" x2="120" y2={120 - i * 20} />
        ))}
      </g>
    </svg>
  );
}

export function Plus({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`pointer-events-none ${className}`} aria-hidden="true">
      <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function WaveDivider({ className = "", fill = "var(--fondo)" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className={`block h-10 w-full md:h-16 ${className}`} aria-hidden="true">
      <path d="M0 80V40c160 26 320 39 480 26S800 0 960 0s320 40 480 52v28H0z" fill={fill} />
    </svg>
  );
}

export function StepDivider({ className = "", fill = "var(--fondo)" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className={`block h-8 w-full md:h-12 ${className}`} aria-hidden="true">
      <path d="M0 48V24h360l40-24h1040v48H0z" fill={fill} />
    </svg>
  );
}
