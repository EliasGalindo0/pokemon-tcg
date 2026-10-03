"use client";

import { useState, useTransition } from "react";
import { getDeckListTextAction } from "@/actions/decks";
import { Button } from "@/components/ui/button";

export function DeckListExport({ deckId }: { deckId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function generate() {
    setMessage(null);
    setCopied(false);
    startTransition(async () => {
      const result = await getDeckListTextAction(deckId);
      if (!result.ok || !("text" in result) || !result.text) {
        setMessage(result.message ?? "Não foi possível gerar a lista.");
        setText(null);
        return;
      }
      setText(result.text);
    });
  }

  async function copy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setMessage(null);
    } catch {
      setMessage("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  return (
    <section className="space-y-3 rounded-3xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Lista do deck</h2>
          <p className="mt-1 text-sm text-muted">
            Gera um texto com Pokémon, Treinador, Estádio e Energia para copiar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={generate}>
            {pending ? "Gerando…" : text ? "Atualizar lista" : "Gerar lista"}
          </Button>
          {text ? (
            <Button type="button" onClick={copy}>
              {copied ? "Copiado" : "Copiar"}
            </Button>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className="text-sm text-ember" role="alert">
          {message}
        </p>
      ) : null}

      {text ? (
        <textarea
          readOnly
          value={text}
          rows={Math.min(16, Math.max(6, text.split("\n").length + 1))}
          className="w-full resize-y rounded-2xl border border-line bg-paper px-4 py-3 font-mono text-sm text-ink outline-none"
          aria-label="Lista de texto do deck"
        />
      ) : null}
    </section>
  );
}
