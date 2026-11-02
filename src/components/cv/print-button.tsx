"use client";

import { FileDown } from "lucide-react";

// The browser's print dialog saves the sheet as a letter-size PDF; the title becomes the suggested file name.
export function PrintButton({ fileName }: { fileName: string }) {
  function print() {
    const previous = document.title;
    document.title = fileName;
    window.addEventListener("afterprint", () => (document.title = previous), { once: true });
    window.print();
  }

  return (
    <button type="button" onClick={print} className="btn btn-secondary">
      <FileDown /> Descargar PDF
    </button>
  );
}
