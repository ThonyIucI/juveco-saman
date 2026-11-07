import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import path from "node:path";
import { defineConfig } from "vitest/config";

const MIGRATIONS_DIR = path.join(__dirname, "../../packages/db/src/migrations");

/**
 * Los tests corren dentro de workerd (mismo runtime que producción) con una D1 en memoria.
 * `TEST_MIGRATIONS` se aplica en `test/setup.ts` antes de cada archivo de test.
 */
export default defineConfig(async () => {
  const migrations = await readD1Migrations(MIGRATIONS_DIR);

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-1234",
            BETTER_AUTH_URL: "http://localhost:3013",
            CORS_ORIGIN: "http://localhost:3012",
            SEED_TOKEN: "test-seed-token",
            /*
              El rate limit guarda el contador en un `Map` de módulo que sobrevive a todo
              el archivo de tests, que puede hacer más de 10 logins. Se apaga solo acá:
              en producción esta variable no existe.
            */
            DISABLE_RATE_LIMIT: "true",
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/setup.ts"],
    },
  };
});
