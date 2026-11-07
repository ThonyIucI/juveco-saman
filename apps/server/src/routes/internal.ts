import { createDb } from "@juveco/db";
import { authUsers } from "@juveco/db/schema/auth";
import { users } from "@juveco/db/schema/users";
import { env } from "@juveco/env/server";
import { EUserRole } from "@juveco/shared/roles";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { forbidden } from "../lib/errors";
import { newId } from "../lib/ids";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";

export const INTERNAL_ROUTES = {
  SEED_SUPERADMIN: "/internal/seed-superadmin",
} as const;

const SEED_TOKEN_HEADER = "x-seed-token";
const MIN_PASSWORD_LENGTH = 8;

const seedSuperadminSchema = z.object({
  email: z.email("Correo inválido."),
  password: z.string().min(MIN_PASSWORD_LENGTH, "La contraseña debe tener al menos 8 caracteres."),
  name: z.string().min(2, "Nombre demasiado corto."),
});

/**
 * Crea el SUPERADMIN (Thony). Protegido por el secret `SEED_TOKEN`.
 * Idempotente: si ya existe un login con ese correo, solo asegura que su persona sea SUPERADMIN.
 *
 * Uso local:  curl -X POST localhost:3013/api/v1/internal/seed-superadmin \
 *               -H "x-seed-token: $SEED_TOKEN" -H "content-type: application/json" \
 *               -d '{"email":"...","password":"...","name":"Thony"}'
 */
const requireSeedToken = createMiddleware(async (context, next) => {
  const providedToken = context.req.header(SEED_TOKEN_HEADER);
  if (!env.SEED_TOKEN || providedToken !== env.SEED_TOKEN) {
    throw forbidden();
  }
  await next();
});

export const internalRoutes = new Hono<TAppEnv>()
  .post(
    INTERNAL_ROUTES.SEED_SUPERADMIN,
    requireSeedToken,
    validateJson(seedSuperadminSchema),
    async (context) => {
      const { email, password, name } = context.req.valid("json");
      const db = createDb();

      const existing = await db
        .select({ userId: authUsers.userId })
        .from(authUsers)
        .where(eq(authUsers.email, email))
        .get();

      if (existing?.userId) {
        await db.update(users).set({ role: EUserRole.SUPERADMIN }).where(eq(users.id, existing.userId));
        return ok(context, { id: existing.userId, email, role: EUserRole.SUPERADMIN, created: false }, 201);
      }

      /* Primero su persona y después su login, enlazado a ella. */
      const userId = newId();
      await db.insert(users).values({ id: userId, firstName: name, role: EUserRole.SUPERADMIN });
      const { user: login } = await context.var.auth.api.signUpEmail({ body: { email, password, name } });
      await db.update(authUsers).set({ userId }).where(eq(authUsers.id, login.id));

      return ok(
        context,
        { id: userId, email, role: EUserRole.SUPERADMIN, created: true },
        201,
      );
    },
  );
