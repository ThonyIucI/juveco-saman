import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Error de dominio con status HTTP y mensaje para el usuario final (en español, sin IDs).
 * El handler global de `index.ts` lo convierte al sobre `{ success: false, error }`.
 */
export class AppError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (message: string) => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);
export const badRequest = (message: string) => new AppError(400, message);
export const unauthorized = (message = "Debes iniciar sesión.") => new AppError(401, message);
export const forbidden = (message = "No tienes permiso para hacer esto.") =>
  new AppError(403, message);
