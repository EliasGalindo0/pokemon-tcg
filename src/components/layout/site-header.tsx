import Link from "next/link";
import { Pokeball } from "@/components/brand/pokeball";
import { NavLink } from "@/components/layout/nav-link";
import { ButtonLink } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy text-paper shadow-[0_12px_30px_-24px_rgba(20,32,51,0.9)]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-30 focus:rounded-full focus:bg-paper focus:px-3 focus:py-2 focus:text-sm focus:text-navy"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="mr-auto flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-paper shadow-sm">
            <Pokeball className="h-8 w-8" />
          </span>
          <span>
            <span className="block font-display text-xl leading-none">Álbum</span>
            <span className="text-xs text-white/65">Pokémon TCG</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Principal">
          <NavLink href="/" tone="dark">
            Painel
          </NavLink>
          <NavLink href="/album" tone="dark">
            Álbum
          </NavLink>
          <NavLink href="/cards" tone="dark">
            Galeria
          </NavLink>
          <NavLink href="/decks" tone="dark">
            Decks
          </NavLink>
        </nav>
        <ButtonLink href="/cards/new">Nova carta</ButtonLink>
      </div>
    </header>
  );
}
