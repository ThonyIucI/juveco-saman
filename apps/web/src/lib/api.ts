import { API_PREFIX, type IApiResponse } from "@juveco/shared/api";

import { getServerOrigin } from "./auth-client";

/** Error con el mensaje en español que mandó el server, listo para mostrar en un toast. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  401: "Tu sesión expiró. Vuelve a entrar.",
  403: "No tienes permiso para hacer esto.",
  404: "No encontramos lo que buscabas.",
};

const messageForStatus = (status: number): string =>
  FALLBACK_MESSAGES[status] ?? "No pudimos conectar con el servidor. Revisa tu internet.";

interface IRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Cliente de `/api/v1`. Manda la cookie de sesión, desempaqueta el sobre
 * `{ success, data, error }` y lanza `ApiError` con el mensaje del server.
 */
export const apiRequest = async <TData>(
  path: string,
  { method = "GET", body, signal }: IRequestOptions = {},
): Promise<TData> => {
  let response: Response;

  try {
    response = await fetch(`${getServerOrigin()}${API_PREFIX}${path}`, {
      method,
      credentials: "include",
      signal,
      ...(body !== undefined && {
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("No pudimos conectar con el servidor. Revisa tu internet.", 0);
  }

  const payload = (await response.json().catch(() => null)) as IApiResponse<TData> | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.error ?? messageForStatus(response.status), response.status);
  }

  // El sobre tipa `data` como `T | null` para poder representar errores; en una respuesta
  // exitosa el nulo solo aparece cuando el propio `TData` lo admite (p. ej. curso activo).
  return payload.data as TData;
};
