import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { Pokeball } from "@/components/brand/pokeball";
import { GlobalSearch } from "@/components/layout/global-search";
import { SiteNav, type SiteNavItem } from "@/components/layout/site-nav";
import { Button, ButtonLink } from "@/components/ui/button";
import { getSessionUser, isAdmin } from "@/lib/auth";
import {
  APP_BRAND,
  APP_TAGLINE,
  NAV_ACCOUNT,
  NAV_COLLECTIONS,
  NAV_DASHBOARD,
  NAV_DECKS,
  NAV_MY_COLLECTION,
  NAV_OFFERS,
  NAV_TRADES,
  NAV_USERS,
} from "@/lib/site-copy";
import { countPendingTradeOffers } from "@/services/trade-offers";

export async function SiteHeader() {
  const user = await getSessionUser();
  const admin = await isAdmin();
  const mustChange = Boolean(user?.mustChangeCredentials);
  const pendingOffers = user && !mustChange ? await countPendingTradeOffers(user.id) : 0;
  const homeHref = mustChange ? "/conta" : admin ? "/" : user ? "/cards" : "/galeria";

  const items: SiteNavItem[] = [];
  if (mustChange) {
    items.push({ href: "/conta", label: NAV_ACCOUNT });
  } else {
    if (admin) {
      items.push({ href: "/", label: NAV_DASHBOARD });
    }
    if (user) {
      items.push({ href: "/cards", label: NAV_MY_COLLECTION });
    }
    items.push({ href: "/galeria", label: NAV_COLLECTIONS });
    items.push({ href: "/trocas", label: NAV_TRADES });
    if (admin) {
      items.push({ href: "/decks", label: NAV_DECKS });
    }
    if (user) {
      items.push({
        href: "/ofertas",
        label: pendingOffers > 0 ? `${NAV_OFFERS} (${pendingOffers})` : NAV_OFFERS,
      });
      items.push({ href: "/conta", label: NAV_ACCOUNT });
    }
    if (admin) {
      items.push({ href: "/admin/usuarios", label: NAV_USERS });
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy text-paper shadow-[0_12px_30px_-24px_rgba(20,32,51,0.9)]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-30 focus:rounded-full focus:bg-paper focus:px-3 focus:py-2 focus:text-sm focus:text-navy"
      >
        Pular para o conteúdo
      </a>
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3">
        <Link href={homeHref} className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper shadow-sm">
            <Pokeball className="h-8 w-8" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-xl leading-none">{APP_BRAND}</span>
            <span className="hidden text-xs text-white/65 sm:block">{APP_TAGLINE}</span>
          </span>
        </Link>

        {user && !mustChange ? (
          <div className="order-last w-full min-w-0 basis-full sm:order-0 sm:w-auto sm:max-w-xs sm:flex-1 sm:basis-auto lg:mx-2">
            <GlobalSearch />
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SiteNav
            items={items}
            mobileExtras={
              admin && !mustChange ? [{ href: "/cards/new", label: "Nova carta" }] : []
            }
          />
          {user ? (
            <>
              {admin && !mustChange ? (
                <ButtonLink href="/cards/new" className="hidden sm:inline-flex">
                  Nova carta
                </ButtonLink>
              ) : null}
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" className="text-paper hover:bg-white/10">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <ButtonLink
              href="/login"
              variant="secondary"
              className="border-white/20 bg-transparent text-paper hover:bg-white/10"
            >
              Entrar
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}
