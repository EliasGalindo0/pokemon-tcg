"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="rounded-3xl border border-line bg-card px-6 py-16 text-center">
      <h1 className="font-display text-3xl">Não foi possível carregar esta página</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Confira se o Postgres está no ar e tente de novo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-navy px-4 py-2 text-sm font-medium text-paper"
      >
        Tentar de novo
      </button>
    </section>
  );
}
