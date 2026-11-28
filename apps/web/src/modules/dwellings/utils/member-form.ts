import {
  EFamilyRelationship,
  FAMILY_CONTACT_NAME_LENGTH_MESSAGE,
  FAMILY_CONTACT_NAME_MAX_LENGTH,
  FAMILY_CONTACT_NAME_REQUIRED_MESSAGE,
  FAMILY_CONTACT_PHONE_REQUIRED_MESSAGE,
  FAMILY_RELATIONSHIP_INVALID_MESSAGE,
  type IFamilyContact,
  type IFamilyMemberResource,
  type IFamilyMemberUpdateInput,
  type IFamilyResource,
  isFamilyRelationship,
} from "@juveco/shared/families";
import { type IPhone, phoneError } from "@juveco/shared/phones";
import type { IUserDetailResource } from "@juveco/shared/users";
import z from "zod";

import {
  EMPTY_PHONE,
  type IPersonInitialValues,
  buildPersonDefaults,
  personFormSchema,
  toDetailsPayload,
  toPersonPayload,
} from "@/common/utils/person-form";

/** El parentesco que más se repite: ahorra un clic al cargar a los hijos. */
export const DEFAULT_RELATIONSHIP = EFamilyRelationship.CHILD;

/**
 * El formulario de una persona que integra una vivienda, por pasos: los campos de la persona (los
 * del formulario de usuario) más su lugar en la familia. Al crearla desde una fila de «Agregar
 * integrantes» el parentesco y la jefatura vienen de la fila; al editarla, se cambian en el paso
 * Principal.
 */
export const memberPersonSchema = personFormSchema
  .extend({
    isHead: z.boolean(),
    relationship: z.string(),
    contactName: z.string().trim().max(FAMILY_CONTACT_NAME_MAX_LENGTH, FAMILY_CONTACT_NAME_LENGTH_MESSAGE),
    contactPhone: z.object({ countryPrefix: z.string(), number: z.string() }),
  })
  .superRefine((value, context) => {
    if (!value.isHead && !isNonHeadRelationship(value.relationship)) {
      context.addIssue({ code: "custom", path: ["relationship"], message: FAMILY_RELATIONSHIP_INVALID_MESSAGE });
    }
    if (isContactAsked(value)) {
      addContactIssues(value, context);
    }
  });

export type TMemberPersonValues = z.input<typeof memberPersonSchema>;

const isNonHeadRelationship = (value: string): boolean =>
  isFamilyRelationship(value) && value !== EFamilyRelationship.HEAD;

/* El contacto alternativo solo se pide al jefe sin celular. */
export const isContactAsked = (value: Pick<TMemberPersonValues, "isHead" | "phone">): boolean =>
  value.isHead && value.phone.number.trim() === "";

const addContactIssues = (value: TMemberPersonValues, context: z.RefinementCtx) => {
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

interface INewMemberPersonOptions {
  /** Lo que ya se escribió en el buscador de la fila (su DNI, su nombre o su celular). */
  initialValues?: IPersonInitialValues;
  isHead: boolean;
  relationship: string;
}

/** Una persona nueva que se crea desde una fila: lo escrito en el buscador y el lugar de la fila. */
export const buildNewMemberPersonDefaults = ({
  initialValues,
  isHead,
  relationship,
}: INewMemberPersonOptions): TMemberPersonValues => ({
  ...buildPersonDefaults(undefined, initialValues),
  isHead,
  relationship,
  contactName: "",
  contactPhone: EMPTY_PHONE,
});

/** Valores de relleno mientras no hay una persona a la que abrir el formulario (modal cerrada o cargando). */
export const EMPTY_MEMBER_PERSON: TMemberPersonValues = buildNewMemberPersonDefaults({
  isHead: false,
  relationship: DEFAULT_RELATIONSHIP,
});

/** Para editar: la persona con sus datos del censo (ya cargados) y su lugar en la familia. */
export const buildEditMemberDefaults = (
  member: IFamilyMemberResource,
  family: IFamilyResource | null,
  detailed: IUserDetailResource,
): TMemberPersonValues => {
  const isHead = member.relationship === EFamilyRelationship.HEAD;
  return {
    ...buildPersonDefaults(detailed),
    isHead,
    relationship: isHead ? DEFAULT_RELATIONSHIP : member.relationship,
    contactName: family?.contact?.name ?? "",
    contactPhone: family?.contact?.phone ?? EMPTY_PHONE,
  };
};

export const headOf = (family: IFamilyResource | null): IFamilyMemberResource | undefined =>
  family?.members.find((member) => member.relationship === EFamilyRelationship.HEAD);

const toContact = (name: string, phone: IPhone): IFamilyContact | null => {
  const trimmedName = name.trim();
  const number = phone.number.trim();
  return trimmedName && number ? { name: trimmedName, phone: { countryPrefix: phone.countryPrefix, number } } : null;
};

/** El contacto alternativo del formulario; `null` si no se pide (tiene celular o no es jefe) o está vacío. */
export const contactOf = (value: TMemberPersonValues): IFamilyContact | null =>
  isContactAsked(value) ? toContact(value.contactName, value.contactPhone) : null;

export const toMemberUpdatePayload = (value: TMemberPersonValues): IFamilyMemberUpdateInput => ({
  person: { ...toPersonPayload(value), details: toDetailsPayload(value) },
  isHead: value.isHead,
  relationship: value.isHead ? undefined : (value.relationship as EFamilyRelationship),
  contact: contactOf(value),
});
