import {
  EFamilyRelationship,
  FAMILY_CONTACT_NAME_LENGTH_MESSAGE,
  FAMILY_CONTACT_NAME_MAX_LENGTH,
  FAMILY_CONTACT_NAME_REQUIRED_MESSAGE,
  FAMILY_CONTACT_PHONE_REQUIRED_MESSAGE,
  FAMILY_NOT_CHOSEN_MESSAGE,
  FAMILY_RELATIONSHIP_INVALID_MESSAGE,
  type IFamilyContact,
  type IFamilyMemberResource,
  type IFamilyMemberSaveInput,
  type IFamilyMemberUpdateInput,
  type IFamilyResource,
  NEW_FAMILY,
  isFamilyRelationship,
} from "@juveco/shared/families";
import { type IPhone, phoneError } from "@juveco/shared/phones";
import z from "zod";

import {
  EMPTY_PHONE,
  buildPersonDefaults,
  personFormSchema,
  toDetailsPayload,
  toPersonPayload,
} from "@/common/utils/person-form";

/** El parentesco que más se repite: ahorra un clic al cargar a los hijos. */
export const DEFAULT_RELATIONSHIP = EFamilyRelationship.CHILD;

/**
 * El formulario de un integrante: los campos de la persona (los del formulario de usuario) más
 * lo de su lugar en la vivienda. `familyChoice`: «» = la familia por defecto, un id, o `NEW_FAMILY`.
 */
export const buildMemberFormSchema = (isFamilyRequired: boolean) =>
  personFormSchema
    .extend({
      /* El id de la persona elegida en el buscador; «» = una persona nueva. */
      userId: z.string(),
      isHead: z.boolean(),
      relationship: z.string(),
      familyChoice: z.string(),
      contactName: z.string().trim().max(FAMILY_CONTACT_NAME_MAX_LENGTH, FAMILY_CONTACT_NAME_LENGTH_MESSAGE),
      contactPhone: z.object({ countryPrefix: z.string(), number: z.string() }),
    })
    .superRefine((value, context) => {
      if (!value.isHead && !isNonHeadRelationship(value.relationship)) {
        context.addIssue({ code: "custom", path: ["relationship"], message: FAMILY_RELATIONSHIP_INVALID_MESSAGE });
      }
      if (isFamilyRequired && value.familyChoice === "") {
        context.addIssue({ code: "custom", path: ["familyChoice"], message: FAMILY_NOT_CHOSEN_MESSAGE });
      }
      if (isContactAsked(value)) {
        addContactIssues(value, context);
      }
    });

export type TMemberFormValues = z.input<ReturnType<typeof buildMemberFormSchema>>;

const isNonHeadRelationship = (value: string): boolean =>
  isFamilyRelationship(value) && value !== EFamilyRelationship.HEAD;

/* El contacto alternativo solo se pide al jefe sin celular. */
export const isContactAsked = (value: Pick<TMemberFormValues, "isHead" | "phone">): boolean =>
  value.isHead && value.phone.number.trim() === "";

const addContactIssues = (value: TMemberFormValues, context: z.RefinementCtx) => {
  const hasName = value.contactName !== "";
  const hasNumber = value.contactPhone.number.trim() !== "";
  if (hasNumber) {
    const message = phoneError(value.contactPhone.countryPrefix, value.contactPhone.number);
    if (message) {
      context.addIssue({ code: "custom", path: ["contactPhone"], message });
    }
  }
  if (hasNumber && !hasName) {
    context.addIssue({ code: "custom", path: ["contactName"], message: FAMILY_CONTACT_NAME_REQUIRED_MESSAGE });
  }
  if (hasName && !hasNumber) {
    context.addIssue({ code: "custom", path: ["contactPhone"], message: FAMILY_CONTACT_PHONE_REQUIRED_MESSAGE });
  }
};

interface INewMemberDefaultsOptions {
  /** La vivienda todavía no tiene integrantes: el primero es el jefe. */
  isFirst: boolean;
  familyChoice?: string;
}

export const buildNewMemberDefaults = ({ isFirst, familyChoice = "" }: INewMemberDefaultsOptions): TMemberFormValues => ({
  ...buildPersonDefaults(),
  userId: "",
  isHead: isFirst,
  relationship: DEFAULT_RELATIONSHIP,
  familyChoice,
  contactName: "",
  contactPhone: EMPTY_PHONE,
});

/** Para editar: lo que ya se sabe del integrante y de su familia; el resto llega al cargar a la persona. */
export const buildEditMemberDefaults = (member: IFamilyMemberResource, family: IFamilyResource | null): TMemberFormValues => {
  const isHead = member.relationship === EFamilyRelationship.HEAD;
  return {
    ...buildPersonDefaults(),
    firstName: member.firstName,
    paternalLastName: member.paternalLastName ?? "",
    maternalLastName: member.maternalLastName ?? "",
    phone: member.phone ?? EMPTY_PHONE,
    userId: member.userId,
    isHead,
    relationship: isHead ? DEFAULT_RELATIONSHIP : member.relationship,
    familyChoice: "",
    contactName: family?.contact?.name ?? "",
    contactPhone: family?.contact?.phone ?? EMPTY_PHONE,
  };
};

/** La familia de la vivienda donde cae la persona, según lo elegido; `null` si va en una nueva. */
export const findTargetFamily = (families: IFamilyResource[], familyChoice: string): IFamilyResource | null => {
  if (familyChoice === NEW_FAMILY) {
    return null;
  }
  if (familyChoice) {
    return families.find((family) => family.id === familyChoice) ?? null;
  }
  return families.length === 1 ? (families[0] ?? null) : null;
};

export const headOf = (family: IFamilyResource | null): IFamilyMemberResource | undefined =>
  family?.members.find((member) => member.relationship === EFamilyRelationship.HEAD);

const toContact = (name: string, phone: IPhone): IFamilyContact | null => {
  const trimmedName = name.trim();
  const number = phone.number.trim();
  return trimmedName && number ? { name: trimmedName, phone: { countryPrefix: phone.countryPrefix, number } } : null;
};

/** Qué parte de la persona se manda: lo que todavía no se cargó no se manda, para no pisarlo. */
export interface IMemberPayloadOptions {
  canSendPerson: boolean;
  canSendDetails: boolean;
}

export const toMemberUpdatePayload = (
  value: TMemberFormValues,
  { canSendPerson, canSendDetails }: IMemberPayloadOptions,
): IFamilyMemberUpdateInput => ({
  person: canSendPerson
    ? { ...toPersonPayload(value), ...(canSendDetails && { details: toDetailsPayload(value) }) }
    : undefined,
  isHead: value.isHead,
  relationship: value.isHead ? undefined : (value.relationship as EFamilyRelationship),
  contact: isContactAsked(value) ? toContact(value.contactName, value.contactPhone) : null,
});

export const toMemberCreatePayload = (
  value: TMemberFormValues,
  options: IMemberPayloadOptions,
): IFamilyMemberSaveInput => ({
  ...toMemberUpdatePayload(value, options),
  userId: value.userId || undefined,
  familyId: value.familyChoice || undefined,
});
