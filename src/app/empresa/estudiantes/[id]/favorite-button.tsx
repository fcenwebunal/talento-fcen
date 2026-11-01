"use client";

import { useOptimistic, useTransition } from "react";
import { Star } from "lucide-react";
import { toggleFavorite } from "@/app/empresa/actions";

export function FavoriteButton({ studentId, isFavorite }: { studentId: string; isFavorite: boolean }) {
  const [pending, startTransition] = useTransition();
  const [fav, setFav] = useOptimistic(isFavorite);

  return (
    <button
      className={`btn ${fav ? "btn-secondary border-amarillo text-amarillo-tinta" : "btn-secondary"}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setFav(!fav);
          await toggleFavorite(studentId, isFavorite);
        })
      }
    >
      <Star className={fav ? "fill-amarillo text-amarillo" : ""} style={fav ? { animation: "pop 0.4s var(--ease-out) both" } : undefined} />
      {fav ? "En favoritos" : "Guardar en favoritos"}
    </button>
  );
}
