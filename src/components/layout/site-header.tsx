import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { Pokeball } from "@/components/brand/pokeball";
import { GlobalSearch } from "@/components/layout/global-search";
import { NavLink } from "@/components/layout/nav-link";
import { Button, ButtonLink } from "@/components/ui/button";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { countPendingTradeOffers } from "@/services/trade-offers";

export async function SiteHeader() {
  const user = await getSessionUser();
  const admin = await isAdmin();
  const mustChange = Boolean(user?.mustChangeCredentials);
  const pendingOffers = user && !mustChange ? await countPendingTradeOffers(user.id) : 0;
  const homeHref = mustChange ? "/conta" : admin ? "/" : "/trocas";

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy text-paper shadow-[0_12px_30px_-24px_rgba(20,32,51,0.9)]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-30 focus:rounded-full focus:bg-paper focus:px-3 focus:py-2 focus:text-sm focus:text-navy"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href={homeHref} className="mr-auto flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-paper shadow-sm">
            <Pokeball className="h-8 w-8" />
          </span>
          <span>
            <span className="block font-display text-xl leading-none">Álbum</span>
            <span className="text-xs text-white/65">Pokémon TCG</span>
          </span>
        </Link>
        {user && !mustChange ? <GlobalSearch /> : null}
        <nav className="flex items-center gap-1" aria-label="Principal">
          {mustChange ? (
            <NavLink href="/conta" tone="dark">
              Conta
            </NavLink>
          ) : (
            <>
              {admin ? (
                <NavLink href="/" tone="dark">
                  Painel
                </NavLink>
              ) : null}
              {admin ? (
                <NavLink href="/album" tone="dark">
                  Álbum
                </NavLink>
              ) : null}
              <NavLink href="/trocas" tone="dark">
                Trocas
              </NavLink>
              <NavLink href="/galeria" tone="dark">
                Galerias
              </NavLink>
              {user ? (
                <NavLink href="/cards" tone="dark">
                  Minha galeria
                </NavLink>
              ) : null}
              {admin ? (
                <NavLink href="/decks" tone="dark">
                  Decks
                </NavLink>
              ) : null}
              {admin ? (
                <NavLink href="/admin/usuarios" tone="dark">
                  Usuários
                </NavLink>
              ) : null}
              {user ? (
                <NavLink href="/ofertas" tone="dark">
                  Ofertas{pendingOffers > 0 ? ` (${pendingOffers})` : ""}
                </NavLink>
              ) : null}
              {user ? (
                <NavLink href="/conta" tone="dark">
                  Conta
                </NavLink>
              ) : null}
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {admin && !mustChange ? <ButtonLink href="/cards/new">Nova carta</ButtonLink> : null}
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" className="text-paper hover:bg-white/10">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <ButtonLink href="/login" variant="secondary" className="border-white/20 bg-transparent text-paper hover:bg-white/10">
              Entrar
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}
