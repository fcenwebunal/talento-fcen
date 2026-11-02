"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, Eye, FileDown, GraduationCap, KeyRound, Loader2, Mail,
  Search, ShieldCheck, Sparkles, UserPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "./google";
import { HelpTip } from "@/components/ui/help-tip";
import { ConnectionNetwork } from "@/components/ui/connect-art";

type Tab = "estudiante" | "empresa";

const BENEFITS: Record<Tab, { icon: typeof Eye; title: string; text: string }[]> = {
  estudiante: [
    { icon: Sparkles, title: "Estudiantes y egresados", text: "Muestra tus habilidades con nivel y evidencia, y decide quién te contacta." },
    { icon: BadgeCheck, title: "Personal de la Facultad", text: "Gestiona empresas, verifica perfiles y recoge datos con tu misma cuenta." },
    { icon: ShieldCheck, title: "Sin otra contraseña", text: "Usamos tu cuenta de la Universidad y nunca vemos tu contraseña." },
  ],
  empresa: [
    { icon: Search, title: "Organizaciones", text: "Busque practicantes por habilidad, programa, idioma, modalidad y ciudad." },
    { icon: Eye, title: "Cuentas con correo y contraseña", text: "Entre con Google o con su correo; la plataforma le muestra lo que corresponde a su cuenta." },
    { icon: FileDown, title: "Hojas de vida y listados", text: "Con la autorización de la Facultad, descargue CV y exporte candidatos." },
  ],
};

export function LoginPanel({ initial }: { initial: Tab }) {
  const [tab, setTab] = useState<Tab>(initial);

  return (
    <div className="page-in mx-auto grid max-w-5xl overflow-hidden rounded-[1.75rem_0.375rem_1.75rem_1.75rem] border border-borde bg-white shadow-xl lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col overflow-hidden bg-celeste p-10 lg:flex">
        <div className="bg-links absolute inset-0" />
        <div className="relative">
          <p className="kicker">{tab === "estudiante" ? "Comunidad UNAL" : "Cuentas externas"}</p>
          <h1 className="display mt-3 text-3xl text-azul-oscuro">
            {tab === "estudiante" ? "Entra con tu cuenta de la Universidad" : "Entra con tu correo o con Google"}
          </h1>
          <ul key={tab} className="stagger mt-8 space-y-5">
            {BENEFITS[tab].map((b) => (
              <li key={b.title} className="flex gap-3">
                <span className="icon-tile bg-white">
                  <b.icon />
                </span>
                <div>
                  <p className="font-black text-azul-oscuro">{b.title}</p>
                  <p className="text-sm text-suave">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <ConnectionNetwork className="relative mt-auto w-full pt-6" />
      </aside>

      <div className="p-6 sm:p-10">
        <h2 className="display text-2xl text-azul-oscuro lg:hidden">Ingresar a Talento FCEN</h2>
        <div className="relative mt-4 grid grid-cols-2 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] bg-superficie p-1 lg:mt-0" role="tablist">
          <span
            className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] bg-white shadow transition-transform duration-300"
            style={{ transform: tab === "empresa" ? "translateX(calc(100% + 0.25rem))" : "translateX(0)", left: "0.25rem" }}
          />
          {(["estudiante", "empresa"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`relative z-10 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-black transition-colors ${tab === t ? "text-azul" : "text-suave"}`}
            >
              {t === "estudiante" ? <GraduationCap className="h-4 w-4" /> : <BriefcaseBusiness className="h-4 w-4" />}
              {t === "estudiante" ? "Ingreso UNAL" : "Ingreso externo"}
            </button>
          ))}
        </div>
        <div key={tab} className="page-in mt-8">
          {tab === "estudiante" ? <StudentLogin /> : <CompanyLogin />}
        </div>
      </div>
    </div>
  );
}

function StudentLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const result = await signInWithGoogle("estudiante");
    if (result === "done") {
      router.replace("/panel");
      router.refresh();
    } else if (result === "cancelled") setLoading(false);
  }

  return (
    <div>
      <p className="flex items-center gap-1.5 text-suave">
        Estudiantes, egresados y personal de la Facultad entran con su cuenta <strong className="text-texto">@unal.edu.co</strong>.
        <HelpTip>
          Usamos tu cuenta de la Universidad para saber que eres de la UNAL. No necesitas otra contraseña y nunca vemos la tuya.
        </HelpTip>
      </p>
      <button onClick={signIn} disabled={loading} className="btn btn-secondary mt-6 w-full justify-center py-3.5 text-base">
        {loading ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
        {loading ? "Abriendo Google…" : "Continuar con mi cuenta @unal.edu.co"}
      </button>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="card-flat flex gap-3 p-4 text-sm">
          <GraduationCap className="h-5 w-5 shrink-0 text-azul-medio" aria-hidden="true" />
          <span className="text-suave">Pregrado, posgrado y egresados recientes de la Facultad.</span>
        </div>
        <div className="card-flat flex gap-3 p-4 text-sm">
          <Building2 className="h-5 w-5 shrink-0 text-azul-medio" aria-hidden="true" />
          <span className="text-suave">Personal de la Facultad: entra igual y la coordinación le asigna su rol.</span>
        </div>
      </div>
    </div>
  );
}

function CompanyLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (result.error) {
      setError(translateAuthError(result.error.message));
      return;
    }
    if (!result.data.session) {
      setError("La cuenta se creó, pero no se pudo iniciar sesión. Intenta ingresar.");
      setMode("login");
      return;
    }
    router.replace(mode === "signup" ? "/empresa/registro" : "/panel");
    router.refresh();
  }

  async function google() {
    setGoogleLoading(true);
    const result = await signInWithGoogle("empresa");
    if (result === "done") {
      router.replace("/panel");
      router.refresh();
    } else if (result === "cancelled") setGoogleLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <button type="button" onClick={google} disabled={googleLoading} className="btn btn-secondary w-full justify-center py-3">
        {googleLoading ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
        {googleLoading ? "Abriendo Google…" : "Continuar con Google"}
      </button>
      <div className="flex items-center gap-3 text-xs text-suave">
        <span className="h-px flex-1 bg-borde" /> o con correo y contraseña <span className="h-px flex-1 bg-borde" />
      </div>
      <p className="text-suave">
        {mode === "login"
          ? "Ingrese con su correo y contraseña. Verá la interfaz que corresponde a su cuenta."
          : "Cree la cuenta de quien representará a su organización. Después registrará los datos de la empresa."}
      </p>
      <label className="field">
        <span>Correo</span>
        <div className="input-icon">
          <Mail aria-hidden="true" />
          <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </label>
      <label className="field">
        <span className="flex items-center gap-1.5">
          Contraseña
          {mode === "signup" && <HelpTip>Mínimo 8 caracteres. Use una que no use en otros sitios.</HelpTip>}
        </span>
        <div className="input-icon">
          <KeyRound aria-hidden="true" />
          <input
            className="input"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </label>
      {error && <p className="text-sm text-naranja">{error}</p>}
      <button className="btn btn-primary btn-arrow w-full py-3" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : mode === "login" ? <ArrowRight /> : <UserPlus />}
        {loading ? "Un momento…" : mode === "login" ? "Ingresar" : "Crear cuenta"}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borde pt-4 text-sm">
        <button type="button" className="font-black text-azul hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Crear una cuenta para mi organización" : "Ya tengo cuenta"}
        </button>
        {mode === "login" && (
          <span className="flex items-center gap-1 text-suave">
            ¿Olvidó la contraseña?
            <HelpTip align="right">Escríbale a la coordinación de la Facultad para restablecerla.</HelpTip>
          </span>
        )}
      </div>
    </form>
  );
}

function translateAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return "Correo o contraseña incorrectos.";
  if (/already registered/i.test(message)) return "Ese correo ya tiene una cuenta. Use la opción Ingresar.";
  if (/password/i.test(message)) return "La contraseña no cumple los requisitos (mínimo 8 caracteres).";
  return "No se pudo completar la operación. Inténtelo de nuevo.";
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
