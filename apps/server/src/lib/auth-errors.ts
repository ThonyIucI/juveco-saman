/**
 * better-auth responde sus errores en inglés (`{ code, message }`). Ninguno puede llegar así
 * a la persona: acá se reemplaza el `message` por uno en español, conservando `code` y la
 * forma que espera el cliente de better-auth.
 */
const AUTH_MESSAGES_BY_CODE: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Correo o contraseña incorrectos.",
  INVALID_EMAIL: "El correo no es válido.",
  INVALID_PASSWORD: "La contraseña no es correcta.",
  PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  USER_NOT_FOUND: "No encontramos ese usuario.",
  USER_ALREADY_EXISTS: "Ya existe un usuario con ese correo.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya existe un usuario con ese correo.",
  EMAIL_NOT_VERIFIED: "Tu correo todavía no está verificado.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Este usuario no tiene contraseña configurada.",
  SESSION_EXPIRED: "Tu sesión expiró. Vuelve a entrar.",
  SESSION_NOT_FRESH: "Por seguridad, vuelve a iniciar sesión para hacer esto.",
  FAILED_TO_GET_SESSION: "No pudimos leer tu sesión. Vuelve a entrar.",
  FAILED_TO_CREATE_SESSION: "No pudimos iniciar tu sesión. Intenta de nuevo.",
  FAILED_TO_CREATE_USER: "No pudimos crear el usuario. Intenta de nuevo.",
  FAILED_TO_UPDATE_USER: "No pudimos guardar los cambios. Intenta de nuevo.",
  INVALID_TOKEN: "El enlace no es válido o ya se usó.",
  TOKEN_EXPIRED: "El enlace expiró. Pide uno nuevo.",
  INVALID_ORIGIN: "Esta página no tiene permiso para iniciar sesión aquí.",
  MISSING_OR_NULL_ORIGIN: "Esta página no tiene permiso para iniciar sesión aquí.",
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: "Esta página no tiene permiso para iniciar sesión aquí.",
  VALIDATION_ERROR: "Revisa los datos enviados.",
  MISSING_FIELD: "Falta completar un campo obligatorio.",
  FIELD_NOT_ALLOWED: "Se envió un dato que no se puede modificar.",
};

/** Para errores sin `code` conocido (rate limit, 500 con cuerpo vacío…). */
const AUTH_MESSAGES_BY_STATUS: Record<number, string> = {
  400: "Revisa los datos enviados.",
  401: "Correo o contraseña incorrectos.",
  403: "No tienes permiso para hacer esto.",
  404: "No encontramos lo que buscabas.",
  429: "Demasiados intentos. Espera un minuto e intenta de nuevo.",
};

const UNEXPECTED_MESSAGE = "Ocurrió un error inesperado. Intenta de nuevo.";

const readAuthErrorCode = async (response: Response): Promise<string | undefined> => {
  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as { code?: unknown } | null;

  return typeof body?.code === "string" ? body.code : undefined;
};

export const translateAuthMessage = (status: number, code?: string): string =>
  (code && AUTH_MESSAGES_BY_CODE[code]) ?? AUTH_MESSAGES_BY_STATUS[status] ?? UNEXPECTED_MESSAGE;

/** Deja pasar las respuestas exitosas; a las de error les pone el mensaje en español. */
export const translateAuthResponse = async (response: Response): Promise<Response> => {
  if (response.ok || response.status < 400) {
    return response;
  }

  const code = await readAuthErrorCode(response);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", "application/json");

  return new Response(
    JSON.stringify({ code: code ?? "ERROR", message: translateAuthMessage(response.status, code) }),
    { status: response.status, headers },
  );
};
