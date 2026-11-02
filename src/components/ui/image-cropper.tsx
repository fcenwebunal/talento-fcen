"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Minus, Plus, X } from "lucide-react";

const VIEW = 288; // px of the square crop frame on screen
const OUTPUT = 512; // px of the uploaded image

// Lets the person drag and zoom a photo inside a square frame; returns only the framed part as a JPEG file.
export function ImageCropper({ file, round = true, onCancel, onCrop }: { file: File; round?: boolean; onCancel: () => void; onCrop: (cropped: File) => Promise<void> | void }) {
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // At zoom 1 the shorter side fills the frame
  const base = img ? VIEW / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  const scale = base * zoom;
  const w = img ? img.naturalWidth * scale : 0;
  const h = img ? img.naturalHeight * scale : 0;
  const clamp = (o: { x: number; y: number }) => ({
    x: Math.min(0, Math.max(VIEW - w, o.x)),
    y: Math.min(0, Math.max(VIEW - h, o.y)),
  });

  useEffect(() => {
    if (img) setOffset({ x: (VIEW - img.naturalWidth * base) / 2, y: (VIEW - img.naturalHeight * base) / 2 });
  }, [img, base]);

  function changeZoom(next: number) {
    const z = Math.min(4, Math.max(1, next));
    // Zoom around the center of the frame
    const k = z / zoom;
    setOffset((o) => clamp({ x: VIEW / 2 - (VIEW / 2 - o.x) * k, y: VIEW / 2 - (VIEW / 2 - o.y) * k }));
    setZoom(z);
  }

  async function confirm() {
    if (!img) return;
    setBusy(true);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const size = VIEW / scale;
    ctx.drawImage(img, sx, sy, size, size, 0, 0, OUTPUT, OUTPUT);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (blob) await onCrop(new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-azul-noche/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Recortar imagen">
      <div className="card w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-azul-oscuro">Elige la parte de la imagen</h2>
          <button type="button" onClick={onCancel} className="rounded-md p-1 text-suave hover:bg-celeste" aria-label="Cancelar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-suave">Arrastra para encuadrar y usa el control para acercar o alejar.</p>
        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-lg bg-superficie"
          style={{ width: VIEW, height: VIEW, cursor: drag.current ? "grabbing" : "grab" }}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setOffset(clamp({ x: drag.current.ox + e.clientX - drag.current.x, y: drag.current.oy + e.clientY - drag.current.y }));
          }}
          onPointerUp={() => (drag.current = null)}
          onWheel={(e) => changeZoom(zoom - e.deltaY / 500)}
        >
          {src && img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" draggable={false} className="pointer-events-none absolute max-w-none" style={{ left: offset.x, top: offset.y, width: w, height: h }} />
          )}
          {!img && <Loader2 className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-azul" />}
          <div className="pointer-events-none absolute inset-0" style={{ boxShadow: round ? `0 0 0 ${VIEW}px rgb(7 29 58 / 0.45)` : undefined, borderRadius: round ? "999px" : undefined, outline: "2px solid #fff", outlineOffset: -2 }} />
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => changeZoom(zoom - 0.2)} className="rounded-md p-1.5 text-azul hover:bg-celeste" aria-label="Alejar">
            <Minus className="h-4 w-4" />
          </button>
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} className="flex-1 accent-[var(--azul)]" aria-label="Acercar" />
          <button type="button" onClick={() => changeZoom(zoom + 0.2)} className="rounded-md p-1.5 text-azul hover:bg-celeste" aria-label="Acercar">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
            Cancelar
          </button>
          <button type="button" onClick={confirm} disabled={!img || busy} className="btn btn-primary btn-sm">
            {busy ? <Loader2 className="animate-spin" /> : <Check />} Recortar y subir
          </button>
        </div>
      </div>
    </div>
  );
}
