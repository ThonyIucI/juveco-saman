import { type IPhone, PHONE_MAX_DIGITS, isKnownCountryPrefix, phoneError } from "@juveco/shared/phones";
import { z } from "zod";

/**
 * El WhatsApp de una persona: viaja como `{ countryPrefix, number }` y se
 * guarda en dos columnas (`country_prefix`, `phone`).
 */

const PHONE_DIGITS_MESSAGE = "El número solo lleva dígitos.";

/* `null` = sin teléfono. Se valida contra el país: un número de Perú no sirve con +1. */
export const phoneSchema = z
  .object({
    countryPrefix: z
      .string("Elige el país del número.")
      .refine(isKnownCountryPrefix, "Elige el país del número."),
    number: z
      .string(PHONE_DIGITS_MESSAGE)
      .regex(/^\d+$/, PHONE_DIGITS_MESSAGE)
      .max(PHONE_MAX_DIGITS, "El número es demasiado largo."),
  })
  .superRefine((phone, context) => {
    const message = phoneError(phone.countryPrefix, phone.number);
    if (message) {
      context.addIssue({ code: "custom", message });
    }
  })
  .nullable();

export type TPhoneInput = z.infer<typeof phoneSchema>;

/* El teléfono viaja como un objeto y se guarda en dos columnas. */
export const toPhoneColumns = (phone: TPhoneInput) => ({
  countryPrefix: phone?.countryPrefix ?? null,
  phone: phone?.number ?? null,
});

/* Las dos columnas de vuelta al objeto de la API; `null` si falta alguna. */
export const toPhoneResource = (row: {
  countryPrefix: string | null;
  phone: string | null;
}): IPhone | null =>
  row.countryPrefix && row.phone ? { countryPrefix: row.countryPrefix, number: row.phone } : null;
