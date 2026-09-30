import type { MetadataRoute } from "next";
import { APP_BRAND, APP_TAGLINE } from "@/lib/site-copy";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_BRAND} ${APP_TAGLINE}`,
    short_name: APP_BRAND,
    description: "Coleção, trocas e decks de Pokémon TCG.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f3efe6",
    theme_color: "#142033",
    lang: "pt-BR",
    categories: ["entertainment", "games"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
