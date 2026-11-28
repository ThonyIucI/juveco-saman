import {
  BIRTH_DATE_FUTURE_MESSAGE,
  BIRTH_DATE_INVALID_MESSAGE,
  CONDITION_INVALID_MESSAGE,
  CONDITION_NOTE_LENGTH_MESSAGE,
  CONDITION_NOTE_MAX_LENGTH,
  DOCUMENT_NUMBER_INVALID_MESSAGE,
  EGender,
  type EUserCondition,
  GENDER_INVALID_MESSAGE,
  isGender,
  isUserCondition,
  isValidBirthDate,
  isValidDocumentNumber,
} from "@juveco/shared/user-profiles";
import { isIsoDate, todayInLima } from "@juveco/shared/dates";
import { z } from "zod";

/**
 * Validación de los datos del censo de una persona (`details`). Todo es opcional: los textos
 * vacíos o `null` se guardan como `null`.
 */

const emptyToNull = (value: string) => (value === "" ? null : value);

/* 8 dígitos; sin espacios ni guiones. Vacío o `null` = sin DNI. */
export const documentNumberSchema = z
  .string(DOCUMENT_NUMBER_INVALID_MESSAGE)
  .trim()
  .refine((value) => value === "" || isValidDocumentNumber(value), DOCUMENT_NUMBER_INVALID_MESSAGE)
  .transform(emptyToNull)
  .nullable();

/* «AAAA-MM-DD», que exista y no sea futura. */
export const birthDateSchema = z
  .string(BIRTH_DATE_INVALID_MESSAGE)
  .trim()
  .refine((value) => value === "" || isIsoDate(value), BIRTH_DATE_INVALID_MESSAGE)
  .refine((value) => value === "" || !isIsoDate(value) || isValidBirthDate(value, todayInLima()), BIRTH_DATE_FUTURE_MESSAGE)
  .transform(emptyToNull)
  .nullable();

const genderSchema = z
  .string(GENDER_INVALID_MESSAGE)
  .refine(isGender, GENDER_INVALID_MESSAGE)
  .transform((value) => value as EGender)
  .nullable();

const conditionsSchema = z
  .array(z.string(CONDITION_INVALID_MESSAGE).refine(isUserCondition, CONDITION_INVALID_MESSAGE))
  .transform((values) => [...new Set(values)] as EUserCondition[]);

const conditionNoteSchema = z
  .string(CONDITION_NOTE_LENGTH_MESSAGE)
  .trim()
  .max(CONDITION_NOTE_MAX_LENGTH, CONDITION_NOTE_LENGTH_MESSAGE)
  .transform(emptyToNull)
  .nullable();

export const userProfileSchema = z.object({
  documentNumber: documentNumberSchema.default(null),
  birthDate: birthDateSchema.default(null),
  gender: genderSchema.default(null),
  conditions: conditionsSchema.default([]),
  conditionNote: conditionNoteSchema.default(null),
});

export type TUserProfileBody = z.infer<typeof userProfileSchema>;
