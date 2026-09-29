import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="rounded-3xl border border-line bg-card px-6 py-16 text-center">
      <h1 className="font-display text-3xl">Carta não encontrada</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">Esse registro não está na coleção.</p>
      <div className="mt-6">
        <ButtonLink href="/cards" variant="secondary">
          Ir para a coleção
        </ButtonLink>
      </div>
    </section>
  );
}
