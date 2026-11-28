import { NEIGHBORHOOD_INVALID_MESSAGE, isKnownNeighborhood } from "@juveco/shared/neighborhoods";
import {
  FIRST_NAME_LENGTH_MESSAGE,
  MATERNAL_LAST_NAME_LENGTH_MESSAGE,
  PATERNAL_LAST_NAME_LENGTH_MESSAGE,
  PERSON_NAME_MAX_LENGTH,
  PERSON_NAME_MIN_LENGTH,
  PERSON_NOTE_LENGTH_MESSAGE,
  PERSON_NOTE_MAX_LENGTH,
} from "@juveco/shared/people";
import {
  WHATSAPP_USERNAME_INVALID_MESSAGE,
  isValidWhatsAppUsername,
  toWhatsAppUsername,
} from "@juveco/shared/whatsapp";
import { z } from "zod";

import { phoneSchema } from "./phone-input";
import { userProfileSchema } from "./user-profile-input";

/**
 * Validación de los datos de una persona. Los textos opcionales llegan vacíos o `null` y se
 * guardan como `null`.
 */

const collapseSpaces = (value: string) => value.replace(/\s+/g, " ");
const emptyToNull = (value: string) => (value === "" ? null : value);

export const firstNameSchema = z
  .string("Escribe los nombres.")
  .trim()
  .min(PERSON_NAME_MIN_LENGTH, FIRST_NAME_LENGTH_MESSAGE)
  .max(PERSON_NAME_MAX_LENGTH, FIRST_NAME_LENGTH_MESSAGE)
  .transform(collapseSpaces);

const optionalText = (maxLength: number, message: string) =>
  z.string(message).trim().max(maxLength, message).transform(collapseSpaces).transform(emptyToNull).nullable();

export const paternalLastNameSchema = optionalText(PERSON_NAME_MAX_LENGTH, PATERNAL_LAST_NAME_LENGTH_MESSAGE);
export const maternalLastNameSchema = optionalText(PERSON_NAME_MAX_LENGTH, MATERNAL_LAST_NAME_LENGTH_MESSAGE);
/* Se valida contra las constantes, sin consultar la tabla. */
export const neighborhoodIdSchema = z
  .string(NEIGHBORHOOD_INVALID_MESSAGE)
  .refine(isKnownNeighborhood, NEIGHBORHOOD_INVALID_MESSAGE)
  .nullable();
export const noteSchema = optionalText(PERSON_NOTE_MAX_LENGTH, PERSON_NOTE_LENGTH_MESSAGE);


/* Con o sin «@»; se guarda sin ella. Vacío o `null` = sin usuario. */
export const whatsappUsernameSchema = z
  .string(WHATSAPP_USERNAME_INVALID_MESSAGE)
  .transform(toWhatsAppUsername)
  .refine((value) => value === "" || isValidWhatsAppUsername(value), WHATSAPP_USERNAME_INVALID_MESSAGE)
  .transform(emptyToNull)
  .nullable();

/** Los campos de persona que no son los nombres, todos opcionales. */
export const personExtraFields = {
  paternalLastName: paternalLastNameSchema.optional(),
  maternalLastName: maternalLastNameSchema.optional(),
  neighborhoodId: neighborhoodIdSchema.optional(),
  phone: phoneSchema.optional(),
  whatsappUsername: whatsappUsernameSchema.optional(),
  note: noteSchema.optional(),
};

/** Una persona completa: nombres, el resto de sus datos y los del censo (`details`). */
export const personSchema = z.object({
  firstName: firstNameSchema,
  ...personExtraFields,
  details: userProfileSchema.optional(),
});

export type TPersonBody = z.infer<typeof personSchema>;
