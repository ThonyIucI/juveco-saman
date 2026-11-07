import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

// Aplica las migraciones de Drizzle a la D1 de pruebas antes de cada archivo de test.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
