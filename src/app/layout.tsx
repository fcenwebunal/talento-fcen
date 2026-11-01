import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EmbedBridge } from "@/components/embed-bridge";
import { EMBED_COOKIE } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Talento FCEN", template: "%s · Talento FCEN" },
  description:
    "Conectamos a estudiantes y egresados recientes de la Facultad de Ciencias Exactas y Naturales de la UNAL Manizales con empresas que buscan su talento.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const embedded = (await cookies()).get(EMBED_COOKIE)?.value === "1";

  return (
    <html lang="es-CO">
      <body className={`flex min-h-screen flex-col ${embedded ? "embed" : ""}`}>
        <SiteHeader embedded={embedded} />
        <main className="flex-1">{children}</main>
        {!embedded && <SiteFooter />}
        {embedded && (
          <Suspense>
            <EmbedBridge />
          </Suspense>
        )}
      </body>
    </html>
  );
}
