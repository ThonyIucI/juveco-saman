import type { D1Migration } from "@cloudflare/vitest-pool-workers";

// Binding extra que solo existe en tests (ver vitest.config.ts).
declare module "cloudflare:workers" {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
