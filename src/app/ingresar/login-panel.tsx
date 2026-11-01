"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UNAL_DOMAIN } from "@/lib/config";

type Tab = "estudiante" | "empresa";

export function LoginPanel({ initial }: { initial: Tab }) {
  const [tab, setTab] = useState<Tab>(initial);

  return (
    <div className="mt-8">
      <div className="inline-flex rounded-lg border border-borde bg-superficie p-1" role="tablist">
        {(["estudiante", "empresa"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-bold ${tab === t ? "bg-white text-azul shadow-sm" : "text-suave"}`}
          >
            {t === "estudiante" ? "Estudiantes, egresados y Facultad" : "Empresas"}
          </button>
        ))}
      </div>
      <div className="mt-6">{tab === "estudiante" ? <StudentLogin /> : <CompanyLogin />}</div>
    </div>
  );
}

function StudentLogin() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: UNAL_DOMAIN, prompt: "select_account" },
      },
    });
  }

  return (
    <div className="card max-w-xl">
      <p className="text-suave">
        Entra con tu cuenta institucional <strong className="text-texto">@unal.edu.co</strong>. Así sabemos que eres de la
        Universidad y no necesitas otra contraseña.
      </p>
      <button onClick={signIn} disabled={loading} className="btn btn-primary mt-5 w-full sm:w-auto">
        <GoogleIcon />
        {loading ? "Abriendo Google…" : "Entrar con mi cuenta @unal.edu.co"}
      </button>
      <p className="mt-4 text-xs text-suave">
        El personal de la Facultad también entra por aquí; la coordinación le asigna su rol.
      </p>
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
    router.replace(mode === "signup" ? "/empresa/registro" : "/empresa");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card max-w-xl space-y-4">
      <p className="text-suave">
        {mode === "login"
          ? "Ingrese con el correo y la contraseña de su organización."
          : "Cree la cuenta de la persona que representará a su organización. Después registrará los datos de la empresa."}
      </p>
      <label className="field">
        <span>Correo</span>
        <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">
        <span>Contraseña</span>
        <input
          className="input"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "signup" && <small>Mínimo 8 caracteres.</small>}
      </label>
      {error && <p className="text-sm text-naranja">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Un momento…" : mode === "login" ? "Ingresar" : "Crear cuenta"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Crear una cuenta de empresa" : "Ya tengo cuenta"}
        </button>
      </div>
      {mode === "login" && (
        <p className="text-xs text-suave">¿Olvidó la contraseña? Escríbale a la coordinación de la Facultad para restablecerla.</p>
      )}
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
