import { env } from "cloudflare:workers";

import app from "../src/index";

const BASE_URL = "http://localhost:3013";
const JSON_HEADERS = { "content-type": "application/json" };

/** Ejecuta una request contra la app Hono dentro del runtime de Workers. */
export const request = (path: string, init?: RequestInit) =>
  app.request(new Request(`${BASE_URL}${path}`, init), undefined, env as never);

export const postJson = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  request(path, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...headers },
    body: JSON.stringify(body),
  });

export const patchJson = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  request(path, {
    method: "PATCH",
    headers: { ...JSON_HEADERS, ...headers },
    body: JSON.stringify(body),
  });

export const putJson = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  request(path, {
    method: "PUT",
    headers: { ...JSON_HEADERS, ...headers },
    body: JSON.stringify(body),
  });

/** Inicia sesión y devuelve la cookie para mandarla en el header `cookie`. */
export const signIn = async (email: string, password: string) => {
  const response = await postJson("/api/auth/sign-in/email", { email, password });
  return response.headers.get("set-cookie") ?? "";
};

export const seedSuperadmin = (credentials: { email: string; password: string; name: string }) =>
  postJson("/api/v1/internal/seed-superadmin", credentials, { "x-seed-token": env.SEED_TOKEN });

/** Crea el superadmin vía el endpoint interno y devuelve la cookie de sesión tras iniciar sesión. */
export const signInAsSuperadmin = async () => {
  const credentials = { email: "super@test.local", password: "password123", name: "Super Test" };

  await seedSuperadmin(credentials);

  const response = await postJson("/api/auth/sign-in/email", {
    email: credentials.email,
    password: credentials.password,
  });

  const cookie = response.headers.get("set-cookie") ?? "";
  return { cookie, credentials };
};
