import { authClient } from "@/lib/auth-client";

type TSession = NonNullable<Awaited<ReturnType<typeof authClient.getSession>>["data"]>;

let cachedSession: Promise<TSession | null> | null = null;

/**
 * La sesión se pide al servidor una sola vez y se guarda en memoria (Thony, 2026-11-18).
 * Antes, cada cambio de vista esperaba a `/get-session` y la pantalla quedaba congelada
 * un par de segundos con la URL ya cambiada.
 *
 * No baja la seguridad: el servidor valida la cookie en cada petición. Si la sesión venció,
 * la API responde 401 y `apiRequest` borra esto y manda al login.
 *
 * Sin sesión no se guarda nada: así, recién iniciada, se vuelve a pedir.
 */
export const getCachedSession = (): Promise<TSession | null> => {
  if (!cachedSession) {
    cachedSession = authClient
      .getSession()
      .then(({ data }) => {
        if (!data) {
          cachedSession = null;
        }
        return data ?? null;
      })
      .catch(() => {
        cachedSession = null;
        return null;
      });
  }
  return cachedSession;
};

/** Al iniciar o cerrar sesión, o si el servidor dice que venció. */
export const clearCachedSession = (): void => {
  cachedSession = null;
};
