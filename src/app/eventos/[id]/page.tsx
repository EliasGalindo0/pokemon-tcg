import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePlayerEventAction } from "@/actions/events";
import { EventForm } from "@/components/events/event-form";
import { EventPrizeBoard } from "@/components/events/event-prize-board";
import { Button } from "@/components/ui/button";
import { requireUserPage } from "@/lib/auth-page";
import { AppError } from "@/lib/errors";
import { EVENT_KIND_LABEL } from "@/lib/labels";
import { getPlayerEvent } from "@/services/events";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const user = await requireUserPage(`/eventos/${id}`);
    const event = await getPlayerEvent(user.id, id);
    return { title: event.name };
  } catch {
    return { title: "Evento" };
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserPage(`/eventos/${id}`);

  let event;
  try {
    event = await getPlayerEvent(user.id, id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/eventos" className="text-sm text-navy hover:underline">
            Todos os eventos
          </Link>
          <h1 className="mt-1 font-display text-4xl tracking-tight">{event.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {EVENT_KIND_LABEL[event.kind]}
            {event.location ? ` · ${event.location}` : ""}
            {event.heldAt ? ` · ${event.heldAt.split("-").reverse().join("/")}` : ""}
            {` · ${event.prizeCount} ${event.prizeCount === 1 ? "carta" : "cartas"}`}
          </p>
        </div>
        <form action={deletePlayerEventAction.bind(null, event.id)}>
          <Button type="submit" variant="danger">
            Excluir evento
          </Button>
        </form>
      </div>

      <EventPrizeBoard eventId={event.id} language="PT_BR" prizes={event.prizes} />

      <section className="space-y-3">
        <h2 className="font-display text-3xl tracking-tight">Dados do evento</h2>
        <EventForm event={event} />
      </section>
    </div>
  );
}
