"use client";

import { useState } from "react";

const CHECKS = [
  { id: "matricula", label: "Estoy matriculado en la Universidad (debo estarlo al formalizar y durante toda la práctica).", key: true },
  { id: "avance", label: "Tengo el avance que exige mi programa para inscribir Trabajo de Grado.", key: true },
  { id: "horario", label: "Tengo disponibilidad para el horario que pide la organización.", key: false },
  { id: "perfil", label: "Mi perfil en Talento FCEN está completo y confirmado.", key: false },
  { id: "periodo", label: "Sé en qué periodo académico quiero hacer la práctica.", key: false },
];

export function ReadinessChecker() {
  const [checked, setChecked] = useState<string[]>([]);
  const missingKey = CHECKS.filter((c) => c.key && !checked.includes(c.id));
  const all = checked.length === CHECKS.length;
  const tone = all ? "verde" : missingKey.some((c) => c.id === "matricula") ? "naranja" : missingKey.length ? "amarillo" : "azul";
  const message = all
    ? "Estás listo para buscar tu práctica."
    : missingKey.some((c) => c.id === "matricula")
      ? "Sin matrícula vigente no se puede formalizar una práctica."
      : missingKey.some((c) => c.id === "avance")
        ? "Revisa con tu dirección curricular cuándo cumplirás el avance y planea tus semestres."
        : "Vas bien: completa lo que falta para empezar a buscar.";

  return (
    <div className="card mt-4">
      <ul className="space-y-3">
        {CHECKS.map((c) => (
          <li key={c.id}>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={checked.includes(c.id)}
                onChange={() => setChecked(checked.includes(c.id) ? checked.filter((x) => x !== c.id) : [...checked, c.id])}
              />
              <span>{c.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className={`mt-5 flex items-center gap-3 rounded-lg p-3 chip-${tone}`} style={{ borderWidth: 1 }}>
        <span className="flex gap-1" aria-hidden="true">
          {(
            [
              ["naranja", "bg-naranja"],
              ["amarillo", "bg-amarillo"],
              ["verde", "bg-verde"],
            ] as const
          ).map(([c, bg]) => (
            <span key={c} className={`h-3 w-3 rounded-full ${tone === c ? bg : "bg-borde"}`} />
          ))}
        </span>
        <p className="font-black">{message}</p>
      </div>
    </div>
  );
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function DateCalculator() {
  const year = new Date().getFullYear();
  const periods = [0, 1, 2].flatMap((offset) => [`${year + offset}-1`, `${year + offset}-2`]);
  const [period, setPeriod] = useState(periods[1]);
  const [y, semester] = period.split("-").map(Number);
  const start = new Date(y, semester === 1 ? 1 : 7, 1);
  const fmt = (d: Date) => d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const milestones = [
    { when: addMonths(start, -5), what: "Completa y confirma tu perfil en Talento FCEN" },
    { when: addMonths(start, -4), what: "Empieza a buscar y a postularte" },
    { when: addMonths(start, -2), what: "Ideal: tener la carta de aceptación" },
    { when: addMonths(start, -1), what: "Formaliza con la Facultad e inscribe Trabajo de Grado" },
    { when: start, what: "Inicio aproximado de la práctica" },
  ];

  return (
    <div className="card mt-4">
      <label className="field max-w-xs">
        <span>Quiero hacer la práctica en</span>
        <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {periods.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <ol className="mt-5 grid gap-3 sm:grid-cols-5">
        {milestones.map((m, i) => (
          <li key={m.what} className={`rounded-lg border p-3 ${i === milestones.length - 1 ? "border-verde bg-verde/10" : "border-borde bg-superficie"}`}>
            <p className="text-xs font-black uppercase tracking-wide text-azul">{fmt(m.when)}</p>
            <p className="mt-1 text-sm">{m.what}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-suave">
        Fechas orientativas: el inicio real depende del calendario académico de cada semestre y de lo que acuerdes con la organización.
      </p>
    </div>
  );
}

export function FlipCards({ items }: { items: { myth: string; fact: string }[] }) {
  const [open, setOpen] = useState<number[]>([]);
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {items.map((it, i) => {
        const flipped = open.includes(i);
        return (
          <button
            key={it.myth}
            onClick={() => setOpen(flipped ? open.filter((x) => x !== i) : [...open, i])}
            className={`min-h-36 rounded-xl border p-4 text-left transition ${flipped ? "border-verde bg-verde/10" : "border-borde bg-white hover:border-azul"}`}
          >
            <p className="text-xs font-black uppercase tracking-wide text-suave">{flipped ? "Realidad" : "Mito"}</p>
            <p className="mt-2 font-black">{flipped ? it.fact : it.myth}</p>
            {!flipped && <p className="mt-3 text-xs text-azul-medio">Toca para ver la realidad</p>}
          </button>
        );
      })}
    </div>
  );
}

const PROGRAMS = [
  { name: "Matemáticas", code: "4100877", credits: "8", semester: "VIII", contact: "carmate_man@unal.edu.co" },
  { name: "Ciencias de la Computación", code: "4200901", credits: "8", semester: "IX", contact: "carmate_man@unal.edu.co" },
  { name: "Ingeniería Física", code: "4100863", credits: "6", semester: "X", contact: "carfisqui_man@unal.edu.co" },
  { name: "Estadística", code: null, credits: null, semester: null, contact: null },
  { name: "Ingeniería Biológica", code: null, credits: null, semester: null, contact: null },
];

export function ProgramPicker() {
  const [name, setName] = useState(PROGRAMS[0].name);
  const p = PROGRAMS.find((x) => x.name === name)!;
  return (
    <div className="card mt-4">
      <label className="field max-w-sm">
        <span>Elige tu programa</span>
        <select className="input" value={name} onChange={(e) => setName(e.target.value)}>
          {PROGRAMS.map((x) => (
            <option key={x.name}>{x.name}</option>
          ))}
        </select>
      </label>
      {p.code ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-4">
          <Fact k="Asignatura" v="Trabajo de Grado" />
          <Fact k="Código" v={p.code} />
          <Fact k="Créditos" v={p.credits!} />
          <Fact k="Semestre sugerido" v={p.semester!} />
        </dl>
      ) : (
        <p className="mt-4">
          <span className="pending">⏳ Por confirmar: programa nuevo, sus datos aún no están en las mallas publicadas</span>
        </p>
      )}
      {p.contact && (
        <p className="mt-4 text-sm">
          Dirección curricular:{" "}
          <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${p.contact}`} target="_blank" rel="noopener">
            {p.contact}
          </a>
        </p>
      )}
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-superficie p-3">
      <dt className="text-xs text-suave">{k}</dt>
      <dd className="display text-lg text-azul-oscuro">{v}</dd>
    </div>
  );
}
