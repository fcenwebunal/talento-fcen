"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export default function LoginDone() {
  useEffect(() => {
    const t = setTimeout(() => window.close(), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <CheckCircle2 className="h-10 w-10 text-verde" aria-hidden="true" />
      <p className="display text-xl text-azul-oscuro">Listo, ya ingresaste</p>
      <p className="text-sm text-suave">Esta ventana se cierra sola. Si no, ciérrala y vuelve a la página de la Facultad.</p>
    </div>
  );
}
