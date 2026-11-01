import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
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
    <div className="bg-dots relative">
      <div className="wrap py-10 md:py-16">
        {error && (
          <p className="page-in mx-auto mb-6 flex max-w-5xl items-center gap-3 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] border border-naranja/30 bg-white p-4 text-sm text-naranja shadow-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {ERRORS[error] ?? ERRORS.auth}
          </p>
        )}
        <LoginPanel initial={como === "empresa" ? "empresa" : "estudiante"} />
      </div>
    </div>
  );
}
