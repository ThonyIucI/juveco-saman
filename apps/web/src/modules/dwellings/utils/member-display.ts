import {
  EFamilyRelationship,
  type IFamilyMemberResource,
  type IFamilyResource,
  familyRelationshipLabels,
} from "@juveco/shared/families";
import { formatInternationalPhone } from "@juveco/shared/phones";
import { genderLabels } from "@juveco/shared/user-profiles";

import { ageLabel } from "@/modules/dwellings/utils/dwellings";

export const pluralizePeople = (count: number): string => `${count} ${count === 1 ? "persona" : "personas"}`;

export const isHeadMember = (member: IFamilyMemberResource): boolean =>
  member.relationship === EFamilyRelationship.HEAD;

/**
 * El celular de la fila. Si el jefe no tiene y la familia dejó el de alguien más, va ese con a
 * quién pertenece («Rosa (vecina) · +51 999 999 999»).
 */
export const memberPhoneLabel = (family: IFamilyResource, member: IFamilyMemberResource): string | null => {
  if (member.phone) {
    return formatInternationalPhone(member.phone.countryPrefix, member.phone.number);
  }
  if (isHeadMember(member) && family.contact) {
    const { name, phone } = family.contact;
    return `${name} · ${formatInternationalPhone(phone.countryPrefix, phone.number)}`;
  }
  return null;
};

export const memberGenderLabel = (member: IFamilyMemberResource): string | null =>
  member.gender ? genderLabels[member.gender] : null;

/** «DNI 12345678 · 12 años · Hijo(a)»: lo que va debajo del nombre en la vista compacta. */
export const memberSummaryLabel = (member: IFamilyMemberResource): string =>
  [
    member.documentNumber ? `DNI ${member.documentNumber}` : null,
    ageLabel(member.age),
    familyRelationshipLabels[member.relationship],
  ]
    .filter(Boolean)
    .join(" · ");
