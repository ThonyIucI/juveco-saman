import { Hono } from "hono";

import type { TAppEnv } from "../lib/app-env";
import { ok } from "../lib/response";

export const HEALTH_ROUTES = {
  HEALTH: "/health",
} as const;

export const healthRoutes = new Hono<TAppEnv>().get(HEALTH_ROUTES.HEALTH, (context) =>
  ok(context, { status: "ok", time: new Date().toISOString() }),
);
