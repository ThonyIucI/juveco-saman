import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Origen de la API.
 * - Dev: `/` (valor por defecto) → mismo origen, Vite hace proxy de `/api` al Worker local.
 * - Prod: URL absoluta del Worker, definida en `apps/web/.env.production`.
 */
const serverUrlSchema = z
  .union([z.url(), z.string().regex(/^\//, "Debe ser una URL absoluta o una ruta que empiece con /")])
  .default("/");

const viteEnv = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: serverUrlSchema,
  },
  runtimeEnv: viteEnv,
  emptyStringAsUndefined: true,
});
