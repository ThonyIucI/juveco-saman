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
  DWELLING_WALL_MATERIAL_OTHER_LENGTH_MESSAGE,
  DWELLING_WALL_MATERIAL_OTHER_MAX_LENGTH,
  DWELLING_WALL_MATERIAL_OTHER_REQUIRED_MESSAGE,
  EDwellingStatus,
  EWallMaterial,
} from "@juveco/shared/dwellings";
import {
  EFamilyRelationship,
  FAMILY_CONTACT_NAME_LENGTH_MESSAGE,
  FAMILY_CONTACT_NAME_MAX_LENGTH,
  FAMILY_CONTACT_NAME_REQUIRED_MESSAGE,
  FAMILY_CONTACT_PHONE_REQUIRED_MESSAGE,
  FAMILY_MEMBER_REQUIRED_MESSAGE,
  FAMILY_RELATIONSHIP_INVALID_MESSAGE,
} from "@juveco/shared/families";
import { NEIGHBORHOOD_INVALID_MESSAGE, isKnownNeighborhood } from "@juveco/shared/neighborhoods";
import { z } from "zod";

import { personSchema } from "./person-input";
import { phoneSchema } from "./phone-input";

/** Validación de viviendas, familias e integrantes. Los textos vacíos se guardan como `null`. */

const emptyToNull = (value: string) => (value === "" ? null : value);

const optionalText = (maxLength: number, message: string) =>
  z.string(message).trim().max(maxLength, message).transform(emptyToNull).nullable();

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
  status: z.enum(EDwellingStatus, DWELLING_STATUS_INVALID_MESSAGE).default(DEFAULT_DWELLING_STATUS),
  wallMaterial: z.enum(EWallMaterial, DWELLING_MATERIAL_INVALID_MESSAGE).nullable(),
  wallMaterialOther: optionalText(
    DWELLING_WALL_MATERIAL_OTHER_MAX_LENGTH,
    DWELLING_WALL_MATERIAL_OTHER_LENGTH_MESSAGE,
  ),
  note: optionalText(DWELLING_TEXT_MAX_LENGTH, DWELLING_TEXT_LENGTH_MESSAGE),
};

/* Las coordenadas van las dos o ninguna. */
const hasCoordinatesPair = (value: { latitude: number | null; longitude: number | null }) =>
  (value.latitude === null) === (value.longitude === null);

/* Con «Otro» hay que decir cuál; con cualquier otro material, el texto sobra y se descarta. */
const hasOtherMaterialText = (value: { wallMaterial: EWallMaterial | null; wallMaterialOther: string | null }) =>
  value.wallMaterial !== EWallMaterial.OTHER || value.wallMaterialOther !== null;

const withoutStaleOtherMaterial = <TValue extends { wallMaterial: EWallMaterial | null; wallMaterialOther: string | null }>(
  value: TValue,
): TValue => ({
  ...value,
  wallMaterialOther: value.wallMaterial === EWallMaterial.OTHER ? value.wallMaterialOther : null,
});

export const updateDwellingSchema = z
  .object(dwellingInputShape)
  .refine(hasCoordinatesPair, { message: DWELLING_COORDINATES_PAIR_MESSAGE })
  .refine(hasOtherMaterialText, {
    path: ["wallMaterialOther"],
    message: DWELLING_WALL_MATERIAL_OTHER_REQUIRED_MESSAGE,
  })
  .transform(withoutStaleOtherMaterial);

export const createDwellingSchema = z
  .object({
    ...dwellingInputShape,
    neighborhoodId: neighborhoodRequiredSchema,
    expectedCode: z.string().min(1),
  })
  .refine(hasCoordinatesPair, { message: DWELLING_COORDINATES_PAIR_MESSAGE })
  .refine(hasOtherMaterialText, {
    path: ["wallMaterialOther"],
    message: DWELLING_WALL_MATERIAL_OTHER_REQUIRED_MESSAGE,
  })
  .transform(withoutStaleOtherMaterial);

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

/* Los campos de un integrante, iguales al crear y al editar. */
const memberFields = {
  /* Con `userId` se actualizan sus datos con `person`; sin él, `person` crea a la persona. */
  person: personSchema.optional(),
  isHead: z.boolean(),
  /* El jefe no tiene parentesco que elegir: es «Jefe(a)». Sin él, el servidor usa «Hijo(a)». */
  relationship: z
    .enum(EFamilyRelationship, FAMILY_RELATIONSHIP_INVALID_MESSAGE)
    .refine((relationship) => relationship !== EFamilyRelationship.HEAD, FAMILY_RELATIONSHIP_INVALID_MESSAGE)
    .optional(),
  contact: contactSchema.default(null),
};

/* Una persona nueva necesita sus datos: sin `userId`, `person` es obligatorio. */
export const createMemberSchema = z
  .object({
    userId: z.string().min(1).optional(),
    /* Un id de familia de la vivienda o «NEW». */
    familyId: z.string().min(1).optional(),
    ...memberFields,
  })
  .refine((body) => body.userId !== undefined || body.person !== undefined, {
    message: FAMILY_MEMBER_REQUIRED_MESSAGE,
  });

export const updateMemberSchema = z.object(memberFields);

export type TCreateMemberBody = z.infer<typeof createMemberSchema>;
export type TUpdateMemberBody = z.infer<typeof updateMemberSchema>;
