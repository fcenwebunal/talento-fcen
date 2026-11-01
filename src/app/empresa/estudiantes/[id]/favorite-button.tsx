"use client";

import { useTransition } from "react";
import { toggleFavorite } from "@/app/empresa/actions";

export function FavoriteButton({ studentId, isFavorite }: { studentId: string; isFavorite: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button className="btn btn-secondary" disabled={pending} onClick={() => startTransition(() => toggleFavorite(studentId, isFavorite))}>
      {isFavorite ? "★ En favoritos" : "☆ Guardar en favoritos"}
    </button>
  );
}
