/**
 * Teléfonos como en id-pos: el **prefijo del país** (`countryPrefix`, «51») y el número
 * nacional en dígitos («987654321») se guardan por separado. En id-pos el prefijo se llama
 * `country_code`; acá `country_prefix`, porque «country code» es el ISO («PE»), no el «+51».
 *
 * Lo usan el front (el campo, el formato y el link de WhatsApp) y el server (la validación).
 */
import {
  AsYouType,
  type CountryCode,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
/* La misma metadata «min» que usa `libphonenumber-js` por defecto (no suma peso). */
import metadata from "libphonenumber-js/min/metadata";

/** Un teléfono: viaja así en la API y se guarda en dos columnas. */
export interface IPhone {
  /** Prefijo del país sin «+»: «51». */
  countryPrefix: string;
  /** Número nacional, solo dígitos: «987654321». */
  number: string;
}

/** Perú: el prefijo con el que arranca el campo. */
export const DEFAULT_COUNTRY_PREFIX = "51";
export const DEFAULT_COUNTRY: CountryCode = "PE";
/** E.164: 15 dígitos como mucho entre prefijo y número. */
export const PHONE_MAX_DIGITS = 15;

export const PHONE_INVALID_MESSAGE = "Revisa el número: no es válido para ese país.";
export const COUNTRY_PREFIX_INVALID_MESSAGE = "Elige el país del número.";

/* `country_calling_codes`: «1» → ["US", "AG", "AI"…], el país principal primero. */
const COUNTRIES_BY_PREFIX: Record<string, CountryCode[] | undefined> = metadata.country_calling_codes;

export const onlyDigits = (value: string): string => value.replace(/\D/g, "");

export const isKnownCountryPrefix = (prefix: string): boolean =>
  Object.hasOwn(COUNTRIES_BY_PREFIX, prefix);

export const prefixOfCountry = (country: CountryCode): string => getCountryCallingCode(country);

/**
 * El país de un prefijo. Varios países comparten prefijo (+1 es EE. UU., Canadá, Puerto
 * Rico…): con el número se sabe cuál es; sin número, el principal.
 */
export const countryOfPhone = (prefix: string, phone = ""): CountryCode => {
  const parsed = phone ? parsePhoneNumberFromString(`+${prefix}${phone}`) : undefined;
  return parsed?.country ?? COUNTRIES_BY_PREFIX[prefix]?.[0] ?? DEFAULT_COUNTRY;
};

/** El número con el formato del país mientras se escribe: «987654321» → «987 654 321». */
export const formatNationalPhone = (phone: string, country: CountryCode): string =>
  phone ? new AsYouType(country).input(phone) : "";

/** El número completo, para copiar o pegar en WhatsApp: «+51987654321». */
export const toFullPhone = (prefix: string, phone: string): string => `+${prefix}${phone}`;

/** Para mostrar: «+51 987 654 321». */
export const formatInternationalPhone = (prefix: string, phone: string): string =>
  parsePhoneNumberFromString(`+${prefix}${phone}`)?.formatInternational() ?? `+${prefix} ${phone}`;

/** `null` si es válido para ese país; si no, el mensaje para el usuario. */
export const phoneError = (prefix: string, phone: string): string | null => {
  if (!isKnownCountryPrefix(prefix)) {
    return COUNTRY_PREFIX_INVALID_MESSAGE;
  }
  const parsed = parsePhoneNumberFromString(`+${prefix}${phone}`);
  return parsed?.isValid() ? null : PHONE_INVALID_MESSAGE;
};

/** Link para escribirle por WhatsApp: `https://wa.me/51987654321`. */
export const whatsAppUrl = (prefix: string, phone: string): string =>
  `https://wa.me/${prefix}${phone}`;
