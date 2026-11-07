import { createAuth, getTrustedOrigins } from "@juveco/auth";
import { isAPIError } from "better-auth/api";
import { API_PREFIX } from "@juveco/shared/api";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";

import type { TAppEnv } from "./lib/app-env";
import { translateAuthMessage, translateAuthResponse } from "./lib/auth-errors";
import { AppError } from "./lib/errors";
import { fail } from "./lib/response";
import { activityRoutes } from "./routes/activities";
import { activityFinanceRoutes } from "./routes/activity-finances";
import { healthRoutes } from "./routes/health";
import { internalRoutes } from "./routes/internal";
import { meRoutes } from "./routes/me";
import { userRoutes } from "./routes/users";

const AUTH_PATH = "/api/auth";
const PUBLIC_SIGN_UP_PATH = `${AUTH_PATH}/sign-up/*`;

/** Mensajes de validación de zod en español (los que un esquema no define a mano). */
z.config(z.locales.es());

const app = new Hono<TAppEnv>();

app.use(logger());

app.use(
  "/*",
  cors({
    origin: getTrustedOrigins(),
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Una instancia de better-auth por request (env solo existe en ejecución).
app.use("/*", async (context, next) => {
  context.set("auth", createAuth());
  await next();
});

// Nadie se registra solo: el acceso lo da el superadmin desde Usuarios.
app.all(PUBLIC_SIGN_UP_PATH, (context) => fail(context, "El registro público no está habilitado.", 403));

// Los errores de better-auth vienen en inglés: se traducen antes de llegar al navegador.
app.on(["POST", "GET"], `${AUTH_PATH}/*`, async (context) =>
  translateAuthResponse(await context.var.auth.handler(context.req.raw)),
);

app.get("/", (context) => context.text("Juveco Samán API"));

app
  .basePath(API_PREFIX)
  .route("/", healthRoutes)
  .route("/", meRoutes)
  .route("/", userRoutes)
  .route("/", activityRoutes)
  .route("/", activityFinanceRoutes)
  .route("/", internalRoutes);

app.notFound((context) => fail(context, "Recurso no encontrado.", 404));

app.onError((error, context) => {
  if (error instanceof AppError) {
    return fail(context, error.message, error.status);
  }
  // better-auth llamado desde nuestras rutas (p. ej. `signUpEmail` al crear un usuario).
  if (isAPIError(error)) {
    const code = (error.body as { code?: unknown } | undefined)?.code;
    const status = error.statusCode as ContentfulStatusCode;
    return fail(context, translateAuthMessage(status, typeof code === "string" ? code : undefined), status);
  }
  // El mensaje de Hono viene en inglés (p. ej. «Malformed JSON»): se usa el genérico por status.
  if (error instanceof HTTPException) {
    return fail(context, translateAuthMessage(error.status), error.status);
  }
  console.error(error);
  return fail(context, "Ocurrió un error inesperado. Intenta de nuevo.", 500);
});

export default app;
