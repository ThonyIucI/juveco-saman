import { EUserRole, type TUserRole, canSignIn } from "@juveco/shared/roles";
import { createMiddleware } from "hono/factory";

import type { TAppEnv } from "../lib/app-env";
import { forbidden, unauthorized } from "../lib/errors";

/**
 * Lee la sesión desde la cookie con better-auth. La sesión ya trae a la persona con su rol
 * (`customSession` en `@juveco/auth`), sin otra consulta. Falla con 401 sin sesión y con 403
 * si el rol no alcanza. Un login sin persona, o con una persona USER, no entra.
 */
const requireRoles = (isAllowed: (role: TUserRole) => boolean) =>
  createMiddleware<TAppEnv>(async (context, next) => {
    const sessionData = await context.var.auth.api.getSession({ headers: context.req.raw.headers });
    const person = sessionData?.user.person;
    if (!sessionData || !person || !canSignIn(person.role)) {
      throw unauthorized();
    }
    if (!isAllowed(person.role)) {
      throw forbidden();
    }

    context.set("authUser", sessionData.user);
    context.set("session", sessionData.session);
    context.set("user", person);
    await next();
  });

/** Solo SUPERADMIN (Thony). */
export const requireSuperadmin = requireRoles((role) => role === EUserRole.SUPERADMIN);

/** Cualquiera que pueda entrar (ADMIN o SUPERADMIN). */
export const requireAuth = requireRoles(() => true);
