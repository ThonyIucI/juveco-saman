/// <reference types="@cloudflare/workers-types" />

// Bindings y variables del Worker. Deben coincidir con `apps/server/wrangler.jsonc`
// (vars + d1_databases) y con los secrets cargados vía `wrangler secret put`.
export interface CloudflareEnv {
  /** Base D1 (SQLite) — binding `DB` en wrangler.jsonc */
  DB: D1Database;
  /** Secret de firma de sesiones de better-auth (≥ 32 chars) */
  BETTER_AUTH_SECRET: string;
  /** URL pública de la API, p. ej. https://juveco-api.gaiamundo.com */
  BETTER_AUTH_URL: string;
  /** Origen permitido para CORS y cookies, p. ej. https://juveco.gaiamundo.com */
  CORS_ORIGIN: string;
  /** Token para el endpoint interno de seed del superadmin */
  SEED_TOKEN: string;
  /**
   * `"true"` apaga el rate limit de better-auth. **Solo para los tests**, que pueden hacer más
   * de 10 ingresos por archivo. No existe en `wrangler.jsonc` ni en producción.
   */
  DISABLE_RATE_LIMIT?: string;
}

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
