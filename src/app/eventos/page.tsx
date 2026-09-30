import type { Metadata } from "next";
import Link from "next/link";
import { EventForm } from "@/components/events/event-form";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireUserPage } from "@/lib/auth-page";
import { EVENT_KIND_LABEL } from "@/lib/labels";
import { listPlayerEvents } from "@/services/events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eventos",
};

function formatDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export default async function EventsPage() {
  const user = await requireUserPage("/eventos");
  const events = await listPlayerEvents(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Jogador"
        title="Eventos"
        description="Campeonatos, ligas e cartas de jogador que você ganhou presencialmente."
      >
        <ButtonLink href="/eventos#novo">Novo evento</ButtonLink>
      </PageHeader>

      {events.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Nenhum evento ainda. Cadastre uma liga ou campeonato e registre as cartas que ganhou.
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/eventos/${event.id}`}
                className="group flex flex-wrap items-baseline justify-between gap-3 py-4 transition hover:text-ember"
              >
                <span>
                  <span className="block font-display text-2xl tracking-tight group-hover:text-ember">
                    {event.name}
                  </span>
                  <span className="text-sm text-muted">
                    {EVENT_KIND_LABEL[event.kind]}
                    {event.location ? ` · ${event.location}` : ""}
                    {formatDate(event.heldAt) ? ` · ${formatDate(event.heldAt)}` : ""}
                  </span>
                </span>
                <span className="text-sm text-muted">
                  {event.prizeCount} {event.prizeCount === 1 ? "carta" : "cartas"}
                  {event.unitCount > event.prizeCount ? ` · ${event.unitCount} un.` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section id="novo" className="scroll-mt-24 space-y-3">
        <h2 className="font-display text-3xl tracking-tight">Novo evento</h2>
        <EventForm />
      </section>
    </div>
  );
}
