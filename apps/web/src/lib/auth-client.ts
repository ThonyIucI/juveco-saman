import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "@juveco/env/web";

const AUTH_PATH = "/api/auth";

/**
 * Origen de la API.
 * - Dev: `VITE_SERVER_URL=/` → mismo origen que el front (Vite hace proxy de /api a wrangler).
 *   Funciona en localhost y desde el celular por la IP de la red.
 * - Prod: `VITE_SERVER_URL=https://juveco-api.gaiamundo.com`.
 */
export const getServerOrigin = (): string => {
  const configured = env.VITE_SERVER_URL.replace(/\/+$/, "");
  if (configured.startsWith("http")) {
    return configured;
  }
  return `${window.location.origin}${configured}`;
};

export const authClient = createAuthClient({
  // better-auth toma la base de rutas del path de esta URL: debe ser /api/auth como en el server
  baseURL: `${getServerOrigin()}${AUTH_PATH}`,
  plugins: [
    // `role` lo agrega el server a la sesión (customSession, desde la persona); acá solo se tipa
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        /* La persona (`users`) a la que apunta el login: es quien vende, cobra, etc. */
        userId: { type: "string", required: false },
      },
    }),
  ],
});
