import { neighborhoodOf } from "@juveco/shared/neighborhoods";
import { Hono } from "hono";

import type { TAppEnv } from "../lib/app-env";
import { ok } from "../lib/response";
import { requireAuth } from "../middleware/require-role";

export const ME_ROUTES = {
  ME: "/me",
} as const;

export const meRoutes = new Hono<TAppEnv>()
  /** Quién entró: su persona, su rol y su correo. */
  .get(ME_ROUTES.ME, requireAuth, (context) => {
    const { user, authUser } = context.var;

    return ok(context, {
      id: user.id,
      firstName: user.firstName,
      paternalLastName: user.paternalLastName,
      maternalLastName: user.maternalLastName,
      neighborhood: neighborhoodOf(user.neighborhoodId),
      role: user.role,
      email: authUser.email,
    });
  });
