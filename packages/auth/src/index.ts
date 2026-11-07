import { createDb } from "@juveco/db";
import * as schema from "@juveco/db/schema/auth";
import { users } from "@juveco/db/schema/users";
import { env } from "@juveco/env/server";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";

const DAY_IN_SECONDS = 60 * 60 * 24;
const MIN_PASSWORD_LENGTH = 8;

/**
 * La sesión caduca a los 7 días **sin usarla**: `updateAge` la renueva como mucho una vez
 * al día mientras el usuario entre.
 */
const SESSION_DAYS = 7;
const LOGIN_MAX_ATTEMPTS_PER_MINUTE = 10;

/** `CORS_ORIGIN` admite varios orígenes separados por coma. */
export const getTrustedOrigins = (): string[] =>
  env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

/**
 * Si el front y la API viven en sitios distintos (pages.dev / workers.dev) la cookie debe ser
 * SameSite=None + Secure. En dev (http://) el navegador rechaza `Secure`, y como Vite hace
 * proxy al mismo origen basta con Lax. Se decide por el esquema de BETTER_AUTH_URL.
 */
const isSecureDeployment = (): boolean => env.BETTER_AUTH_URL.startsWith("https://");

/**
 * Instancia de better-auth. Se crea por request porque `env` (D1, secrets) solo existe
 * dentro del Worker en ejecución. Los administradores entran con correo + contraseña.
 */
/*
  Las tablas llevan prefijo `auth_` (ver schema/auth.ts). El rol y los datos no están acá
  sino en la persona (`users`), a la que apunta `userId`: el cliente nunca lo manda.
*/
const AUTH_MODELS = {
  user: {
    modelName: "authUsers",
    additionalFields: {
      userId: { type: "string", required: false, input: false },
    },
  },
  account: { modelName: "authAccounts" },
  verification: { modelName: "authVerifications" },
} satisfies BetterAuthOptions;

export function createAuth() {
  const db = createDb();
  const secure = isSecureDeployment();

  const options = {
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: getTrustedOrigins(),

    emailAndPassword: { enabled: true, minPasswordLength: MIN_PASSWORD_LENGTH },

    ...AUTH_MODELS,

    session: {
      modelName: "authSessions",
      expiresIn: SESSION_DAYS * DAY_IN_SECONDS,
      updateAge: DAY_IN_SECONDS,
    },

    /*
      El contador vive en un `Map` de módulo: es por isolate, no global. Frena el tanteo de
      contraseñas desde un navegador, no un ataque repartido (para eso, regla WAF).
    */
    rateLimit: {
      enabled: env.DISABLE_RATE_LIMIT !== "true",
      customRules: {
        "/sign-in/email": { window: 60, max: LOGIN_MAX_ATTEMPTS_PER_MINUTE },
      },
    },

    advanced: {
      useSecureCookies: secure,
      defaultCookieAttributes: {
        sameSite: secure ? "none" : "lax",
        secure,
        httpOnly: true,
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth({
    ...options,
    /*
      La sesión trae a la persona (`users`) con su rol: el front lee `session.user.role` y el
      middleware de permisos no vuelve a consultar. `person` es `null` si el login quedó sin
      persona (no debería pasar): ese login no entra.
    */
    plugins: [
      customSession(async ({ user, session }) => {
        const person = user.userId
          ? ((await db.select().from(users).where(eq(users.id, user.userId)).get()) ?? null)
          : null;
        return { user: { ...user, role: person?.role ?? null, person }, session };
      }, options),
    ],
  });
}

export type TAuth = ReturnType<typeof createAuth>;
export type TSession = TAuth["$Infer"]["Session"];
export type TSessionUser = TSession["user"];
