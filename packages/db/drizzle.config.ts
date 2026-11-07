import { defineConfig } from "drizzle-kit";

/**
 * Solo se usa para GENERAR migraciones (`pnpm db:generate`) a partir del schema.
 * Aplicarlas es tarea de wrangler: `wrangler d1 migrations apply juveco-db --local|--remote`
 * (ver apps/server/package.json). Nunca escribir SQL de migración a mano.
 */
export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "sqlite",
  driver: "d1-http",
});
