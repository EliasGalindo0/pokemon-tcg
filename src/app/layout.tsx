import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Pokeball } from "@/components/brand/pokeball";
import { SiteHeader } from "@/components/layout/site-header";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { enforceCredentialChange } from "@/lib/enforce-credentials";
import { APP_BRAND, APP_TAGLINE } from "@/lib/site-copy";
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
    default: APP_BRAND,
    template: `%s · ${APP_BRAND}`,
  },
  description: "Coleção, trocas e decks de Pokémon TCG.",
  applicationName: APP_BRAND,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_BRAND,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#142033",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <main id="conteudo" className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-8">
          {children}
        </main>
        <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 pb-8 text-sm text-muted">
          <Pokeball className="h-5 w-5" />
          <span>{APP_BRAND} · {APP_TAGLINE}</span>
        </footer>
        <PwaRegister />
      </body>
    </html>
  );
}
