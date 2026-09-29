import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { OffersList } from "@/components/trades/offers-list";
import { getSessionUser } from "@/lib/auth";
import { listTradeOffers } from "@/services/trade-offers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofertas",
};

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/ofertas");

  const { status: statusRaw } = await searchParams;
  const status =
    statusRaw === "PENDING" ||
    statusRaw === "ACCEPTED" ||
    statusRaw === "REJECTED" ||
    statusRaw === "CANCELLED"
      ? statusRaw
      : "PENDING";

  const offers = await listTradeOffers(user.id, status);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Trocas"
        title="Ofertas"
        description="Aceite para tirar 1 unidade da pilha de trocas e receber a carta oferecida na coleção (ou na pilha, se você já tiver)."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar ofertas">
        {(
          [
            ["PENDING", "Pendentes"],
            ["ACCEPTED", "Aceitas"],
            ["REJECTED", "Recusadas"],
          ] as const
        ).map(([value, label]) => (
          <a
            key={value}
            href={`/ofertas?status=${value}`}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              status === value ? "bg-navy text-paper" : "bg-card text-ink hover:bg-white"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      <OffersList offers={offers} />
    </div>
  );
}
