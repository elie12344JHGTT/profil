// Configuration Prisma 7 : l'URL n'est plus dans schema.prisma.
// En Docker, DATABASE_URL est injectée par Compose. dotenv complète un .env local.

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
