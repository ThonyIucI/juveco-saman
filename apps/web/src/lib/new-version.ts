/**
 * Después de un deploy, una pestaña que quedó abierta con la versión anterior pide el código
 * de una pantalla (`route-XXXX.js`) que ya no existe: el service worker nuevo borró los
 * archivos viejos. La salida es recargar para traer la versión nueva.
 */

const RELOAD_KEY = "juveco:new-version-reload-at";
/* Si al recargar sigue fallando, no se entra en un bucle de recargas. */
const RELOAD_COOLDOWN_MS = 10_000;

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

/** Si el error es de un archivo de una versión anterior que ya no está publicado. */
export const isStaleVersionError = (error: unknown): boolean =>
  error instanceof Error && CHUNK_ERROR_PATTERN.test(error.message);

/** Recarga la página una vez. `false` si ya se recargó hace poco (el error es otro). */
export const reloadForNewVersion = (): boolean => {
  try {
    const lastReloadAt = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - lastReloadAt < RELOAD_COOLDOWN_MS) {
      return false;
    }
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* Sin sessionStorage (modo privado estricto) igual se recarga. */
  }
  window.location.reload();
  return true;
};
