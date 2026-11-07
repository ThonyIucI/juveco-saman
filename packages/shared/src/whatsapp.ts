/**
 * Usuario de WhatsApp (acordado 2026-10-30): quien no usa un número público tiene un nombre
 * de usuario, y su enlace `wa.me/<usuario>` abre el chat igual que el del número. Lo usan
 * clientes y administradores.
 */

export const WHATSAPP_USERNAME_MIN_LENGTH = 3;
export const WHATSAPP_USERNAME_MAX_LENGTH = 35;

/*
  Propuesta: WhatsApp no publica sus reglas exactas. Letras, números, punto y guion bajo,
  como los usuarios de Instagram.
*/
const WHATSAPP_USERNAME_PATTERN = /^[A-Za-z0-9._]+$/;

export const WHATSAPP_USERNAME_INVALID_MESSAGE =
  "El usuario va de 3 a 35 caracteres: letras, números, punto o guion bajo.";

/** Se escribe con o sin «@» y se guarda sin ella: «@Ana.pe » → «Ana.pe». */
export const toWhatsAppUsername = (value: string): string => value.trim().replace(/^@/, "");

export const isValidWhatsAppUsername = (username: string): boolean =>
  username.length >= WHATSAPP_USERNAME_MIN_LENGTH &&
  username.length <= WHATSAPP_USERNAME_MAX_LENGTH &&
  WHATSAPP_USERNAME_PATTERN.test(username);

/** Para mostrar y copiar: «@ana.pe». */
export const formatWhatsAppUsername = (username: string): string => `@${username}`;

/** Link para escribirle por su usuario: `https://wa.me/ana.pe`. */
export const whatsAppUsernameUrl = (username: string): string => `https://wa.me/${username}`;
