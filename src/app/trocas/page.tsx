import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { TradeSetSearch } from "@/components/trades/trade-set-search";
import { TradeTabs } from "@/components/trades/trade-tabs";
import { isAdmin } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getTradeBoard, listTradeSets } from "@/services/trades";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const metadata: Metadata = {
  title: "Trocas",
};

export default async function TrocasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const admin = await isAdmin();
  const { tab } = await searchParams;
  const sets = await listTradeSets();
  const activeId = tab && sets.some((set) => set.id === tab) ? tab : (sets[0]?.id ?? null);

  let board = null;
  if (activeId) {
    try {
      board = await getTradeBoard(activeId);
    } catch (error) {
      if (!(error instanceof AppError && error.status === 404)) throw error;
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Repetidas"
        title="Trocas"
        description={
          admin
            ? "Cadastre uma coleção pelo número da carta e marque quantas cópias você tem para trocar. Cada coleção fica em uma aba."
            : "Veja as cartas disponíveis e proponha uma troca oferecendo outra carta do catálogo."
        }
      />

      {admin ? (
        <section className="rounded-3xl border border-line bg-card p-5">
          <h2 className="font-display text-2xl">Cadastrar coleção</h2>
          <div className="mt-4">
            <TradeSetSearch />
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Coleções</h2>
        <TradeTabs sets={sets} activeId={activeId} board={board} readOnly={!admin} />
      </section>
    </div>
  );
}
