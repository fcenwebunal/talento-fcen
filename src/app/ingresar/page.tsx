import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/session";
import { LoginPanel } from "./login-panel";

export const metadata: Metadata = { title: "Ingresar" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  unal: "Para entrar como estudiante usa tu cuenta institucional @unal.edu.co.",
  auth: "No pudimos completar el ingreso. Inténtalo de nuevo.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ como?: string; error?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const { como, error } = await searchParams;

  return (
    <div className="wrap max-w-4xl py-12">
      <h1 className="display text-3xl text-azul-oscuro">Ingresar a Talento FCEN</h1>
      {error && (
        <p className="mt-4 rounded-lg border border-naranja/30 bg-naranja/5 p-3 text-sm text-naranja">
          {ERRORS[error] ?? ERRORS.auth}
        </p>
      )}
      <LoginPanel initial={como === "empresa" ? "empresa" : "estudiante"} />
    </div>
  );
}
