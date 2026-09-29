"use client";

import { useState, useTransition } from "react";
import { setCollectionPublicAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function CollectionVisibilityForm({ collectionPublic }: { collectionPublic: boolean }) {
  const [pending, startTransition] = useTransition();
  const [isPublic, setIsPublic] = useState(collectionPublic);
  const [message, setMessage] = useState<string | null>(null);

  function toggle() {
    const next = !isPublic;
    startTransition(async () => {
      const result = await setCollectionPublicAction(next);
      if (result.ok) {
        setIsPublic(next);
        setMessage(result.message ?? null);
      } else {
        setMessage(result.message ?? "Não foi possível atualizar.");
      }
    });
  }

  return (
    <section className="space-y-3 rounded-3xl border border-line bg-card p-5">
      <div>
        <h2 className="font-display text-2xl">Visibilidade da coleção</h2>
        <p className="mt-1 text-sm text-muted">
          {isPublic
            ? "Visitantes podem ver suas cartas em Galerias (sem preços pagos)."
            : "Sua coleção está privada. Só você vê as cartas na Minha galeria."}
        </p>
      </div>
      <Button type="button" variant={isPublic ? "secondary" : "primary"} disabled={pending} onClick={toggle}>
        {pending ? "Salvando…" : isPublic ? "Tornar privada" : "Tornar pública"}
      </Button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </section>
  );
}
