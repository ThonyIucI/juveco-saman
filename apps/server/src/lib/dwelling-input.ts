import {
  DEFAULT_DWELLING_STATUS,
  DWELLING_COORDINATES_PAIR_MESSAGE,
  DWELLING_LATITUDE_INVALID_MESSAGE,
  DWELLING_LATITUDE_RANGE,
  DWELLING_LONGITUDE_INVALID_MESSAGE,
  DWELLING_LONGITUDE_RANGE,
  DWELLING_MATERIAL_INVALID_MESSAGE,
  DWELLING_METER_LENGTH_MESSAGE,
  DWELLING_METER_MAX_LENGTH,
  DWELLING_NEIGHBORHOOD_REQUIRED_MESSAGE,
  DWELLING_STATUS_INVALID_MESSAGE,
  DWELLING_TEXT_LENGTH_MESSAGE,
  DWELLING_TEXT_MAX_LENGTH,
  DWELLING_URL_INVALID_MESSAGE,
  DWELLING_URL_LENGTH_MESSAGE,
  DWELLING_URL_MAX_LENGTH,
  EDwellingStatus,
  EWallMaterial,
} from "@juveco/shared/dwellings";
import {
  FAMILY_CONTACT_NAME_LENGTH_MESSAGE,
  FAMILY_CONTACT_NAME_MAX_LENGTH,
  FAMILY_CONTACT_NAME_REQUIRED_MESSAGE,
  FAMILY_CONTACT_PHONE_REQUIRED_MESSAGE,
  FAMILY_HEAD_REQUIRED_MESSAGE,
  FAMILY_MEMBER_REQUIRED_MESSAGE,
  FAMILY_NOTE_LENGTH_MESSAGE,
  FAMILY_NOTE_MAX_LENGTH,
  FAMILY_RELATIONSHIP_HEAD_MESSAGE,
  FAMILY_RELATIONSHIP_INVALID_MESSAGE,
  EFamilyRelationship,
} from "@juveco/shared/families";
import { NEIGHBORHOOD_INVALID_MESSAGE, isKnownNeighborhood } from "@juveco/shared/neighborhoods";
import { z } from "zod";

import { phoneSchema } from "./phone-input";

/** Validación de viviendas, familias e integrantes. Los textos vacíos se guardan como `null`. */

const emptyToNull = (value: string) => (value === "" ? null : value);

const optionalText = (maxLength: number, message: string) =>
  z.string(message).trim().max(maxLength, message).transform(emptyToNull).nullable();

const urlSchema = z
  .string(DWELLING_URL_INVALID_MESSAGE)
  .trim()
  .max(DWELLING_URL_MAX_LENGTH, DWELLING_URL_LENGTH_MESSAGE)
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), DWELLING_URL_INVALID_MESSAGE)
  .transform(emptyToNull)
  .nullable();

export const neighborhoodRequiredSchema = z
  .string(DWELLING_NEIGHBORHOOD_REQUIRED_MESSAGE)
  .refine(isKnownNeighborhood, NEIGHBORHOOD_INVALID_MESSAGE);

const dwellingInputShape = {
  meterNumber: optionalText(DWELLING_METER_MAX_LENGTH, DWELLING_METER_LENGTH_MESSAGE),
  latitude: z
    .number(DWELLING_LATITUDE_INVALID_MESSAGE)
    .min(DWELLING_LATITUDE_RANGE.min, DWELLING_LATITUDE_INVALID_MESSAGE)
    .max(DWELLING_LATITUDE_RANGE.max, DWELLING_LATITUDE_INVALID_MESSAGE)
    .nullable(),
  longitude: z
    .number(DWELLING_LONGITUDE_INVALID_MESSAGE)
    .min(DWELLING_LONGITUDE_RANGE.min, DWELLING_LONGITUDE_INVALID_MESSAGE)
    .max(DWELLING_LONGITUDE_RANGE.max, DWELLING_LONGITUDE_INVALID_MESSAGE)
    .nullable(),
  mapsUrl: urlSchema,
  status: z.enum(EDwellingStatus, DWELLING_STATUS_INVALID_MESSAGE).default(DEFAULT_DWELLING_STATUS),
  wallMaterial: z.enum(EWallMaterial, DWELLING_MATERIAL_INVALID_MESSAGE).nullable(),
  photosUrl: urlSchema,
  observation: optionalText(DWELLING_TEXT_MAX_LENGTH, DWELLING_TEXT_LENGTH_MESSAGE),
  note: optionalText(DWELLING_TEXT_MAX_LENGTH, DWELLING_TEXT_LENGTH_MESSAGE),
};

/* Las coordenadas van las dos o ninguna. */
const hasCoordinatesPair = (value: { latitude: number | null; longitude: number | null }) =>
  (value.latitude === null) === (value.longitude === null);

export const updateDwellingSchema = z
  .object(dwellingInputShape)
  .refine(hasCoordinatesPair, { message: DWELLING_COORDINATES_PAIR_MESSAGE });

export const createDwellingSchema = z
  .object({
    ...dwellingInputShape,
    neighborhoodId: neighborhoodRequiredSchema,
    expectedCode: z.string().min(1),
  })
  .refine(hasCoordinatesPair, { message: DWELLING_COORDINATES_PAIR_MESSAGE });

const personIdSchema = (message: string) => z.string(message).min(1, message);

const contactSchema = z
  .object({
    name: z
      .string(FAMILY_CONTACT_NAME_REQUIRED_MESSAGE)
      .trim()
      .min(1, FAMILY_CONTACT_NAME_REQUIRED_MESSAGE)
      .max(FAMILY_CONTACT_NAME_MAX_LENGTH, FAMILY_CONTACT_NAME_LENGTH_MESSAGE),
    phone: phoneSchema.refine((phone) => phone !== null, FAMILY_CONTACT_PHONE_REQUIRED_MESSAGE),
  })
  .nullable();

const familyNoteSchema = optionalText(FAMILY_NOTE_MAX_LENGTH, FAMILY_NOTE_LENGTH_MESSAGE);

export const updateFamilySchema = z.object({
  contact: contactSchema,
  note: familyNoteSchema,
});

export const createFamilySchema = updateFamilySchema.extend({
  headId: personIdSchema(FAMILY_HEAD_REQUIRED_MESSAGE),
});

/* El jefe no se elige acá: nace con la familia. */
export const familyMemberSchema = z.object({
  userId: personIdSchema(FAMILY_MEMBER_REQUIRED_MESSAGE),
  relationship: z
    .enum(EFamilyRelationship, FAMILY_RELATIONSHIP_INVALID_MESSAGE)
    .refine((relationship) => relationship !== EFamilyRelationship.HEAD, FAMILY_RELATIONSHIP_HEAD_MESSAGE),
});

export const updateFamilyMemberSchema = familyMemberSchema.pick({ relationship: true });
