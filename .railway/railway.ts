import { defineRailway, github, postgres, project, redis, service, volume } from "railway/iac";

export default defineRailway(() => {
  const db = postgres("postgres");
  const cache = redis("redis");
  const uploads = volume("uploads", { sizeMB: 1024 });

  const app = service("pokemon-tcg", {
    source: github("EliasGalindo0/pokemon-tcg"),
    start: "node server.js",
    preDeploy:
      "node /opt/prisma-cli/node_modules/prisma/build/index.js migrate deploy",
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
    volumeMounts: {
      "/app/public/uploads": uploads,
    },
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,
      TCGDEX_API_URL: "https://api.tcgdex.net/v2",
    },
  });

  return project("pokedex", {
    resources: [app, db, cache, uploads],
  });
});
