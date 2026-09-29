import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Pokeball } from "@/components/brand/pokeball";
import { SiteHeader } from "@/components/layout/site-header";
import { enforceCredentialChange } from "@/lib/enforce-credentials";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Álbum",
    template: "%s · Álbum",
  },
  description: "Coleção, álbum e decks de Pokémon TCG.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await enforceCredentialChange();

  return (
    <html lang="pt-BR" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="relative min-h-full font-sans text-ink">
        <div className="pointer-events-none fixed -right-28 top-28 -z-10 opacity-[0.07]" aria-hidden>
          <Pokeball className="h-[28rem] w-[28rem]" />
        </div>
        <SiteHeader />
        <main id="conteudo" className="mx-auto w-full max-w-6xl px-4 py-8">
          {children}
        </main>
        <footer className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pb-8 text-sm text-muted">
          <Pokeball className="h-5 w-5" />
          <span>Álbum · coleção e decks de Pokémon TCG</span>
        </footer>
      </body>
    </html>
  );
}

