/**
 * Familias de una vivienda (empadronamiento). En una vivienda pueden vivir varias familias; cada
 * una tiene su jefe de hogar, que es su contacto, y sus integrantes con su parentesco respecto
 * al jefe. Una persona (usuario) integra a lo sumo una familia.
 */
import type { INeighborhood } from "./neighborhoods";
import type { IPersonName } from "./people";
import type { IPhone } from "./phones";
import type { EUserCondition } from "./user-profiles";

export const FAMILY_CONTACT_NAME_MAX_LENGTH = 120;
export const FAMILY_NOTE_MAX_LENGTH = 500;

export const FAMILY_HEAD_REQUIRED_MESSAGE = "Elige al jefe de la familia.";
export const FAMILY_MEMBER_REQUIRED_MESSAGE = "Elige a la persona.";
export const FAMILY_RELATIONSHIP_INVALID_MESSAGE = "Elige el parentesco.";
export const FAMILY_RELATIONSHIP_HEAD_MESSAGE = "El jefe se elige al crear la familia.";
export const FAMILY_CONTACT_NAME_LENGTH_MESSAGE = "El nombre del contacto va hasta 120 letras.";
export const FAMILY_CONTACT_NAME_REQUIRED_MESSAGE = "Escribe a quién pertenece ese número.";
export const FAMILY_CONTACT_PHONE_REQUIRED_MESSAGE = "Escribe el número del contacto.";
export const FAMILY_NOTE_LENGTH_MESSAGE = "La nota va hasta 500 letras.";
export const FAMILY_HEAD_LOCKED_MESSAGE =
  "El jefe no se quita ni cambia de parentesco: elimina la familia si ya no vive ahí.";

/** Una persona no integra dos familias: se dice dónde está para ir a buscarla. */
export const personInOtherFamilyMessage = (personName: string, dwellingCode: string): string =>
  `${personName} ya integra una familia de la vivienda ${dwellingCode}.`;

/** Parentesco respecto al jefe de su familia. Sumar uno es sumar una constante y su etiqueta. */
export enum EFamilyRelationship {
  HEAD = "HEAD",
  SPOUSE = "SPOUSE",
  CHILD = "CHILD",
  PARENT = "PARENT",
  SIBLING = "SIBLING",
  GRANDCHILD = "GRANDCHILD",
  GRANDPARENT = "GRANDPARENT",
  IN_LAW = "IN_LAW",
  OTHER_RELATIVE = "OTHER_RELATIVE",
  NOT_RELATIVE = "NOT_RELATIVE",
}

export const familyRelationshipLabels: Record<EFamilyRelationship, string> = {
  [EFamilyRelationship.HEAD]: "Jefe(a) de hogar",
  [EFamilyRelationship.SPOUSE]: "Esposo(a) o pareja",
  [EFamilyRelationship.CHILD]: "Hijo(a)",
  [EFamilyRelationship.PARENT]: "Padre o madre",
  [EFamilyRelationship.SIBLING]: "Hermano(a)",
  [EFamilyRelationship.GRANDCHILD]: "Nieto(a)",
  [EFamilyRelationship.GRANDPARENT]: "Abuelo(a)",
  [EFamilyRelationship.IN_LAW]: "Yerno, nuera o suegro(a)",
  [EFamilyRelationship.OTHER_RELATIVE]: "Otro pariente",
  [EFamilyRelationship.NOT_RELATIVE]: "No es pariente",
};

export const isFamilyRelationship = (value: string): value is EFamilyRelationship =>
  value in familyRelationshipLabels;

/** Los parentescos que se pueden elegir para un integrante: todos menos el jefe. */
export const MEMBER_RELATIONSHIPS: readonly EFamilyRelationship[] = Object.values(EFamilyRelationship).filter(
  (relationship) => relationship !== EFamilyRelationship.HEAD,
);

/** Un integrante tal como lo devuelve la API: la persona, con lo que importa del censo. */
export interface IFamilyMemberResource extends IPersonName {
  /** El id de la pertenencia (`family_members`), para editar el parentesco o quitarlo. */
  id: string;
  /** El id de la persona (usuario). */
  userId: string;
  relationship: EFamilyRelationship;
  neighborhood: INeighborhood | null;
  phone: IPhone | null;
  /** «AAAA-MM-DD»; `null` si no se sabe. */
  birthDate: string | null;
  /** Años cumplidos hoy (Lima); `null` sin fecha de nacimiento. */
  age: number | null;
  conditions: EUserCondition[];
}

/** El contacto alternativo de una familia: a quién pertenece el número. */
export interface IFamilyContact {
  name: string;
  phone: IPhone;
}

export interface IFamilyResource {
  id: string;
  dwellingId: string;
  /** Solo cuando el jefe no tiene teléfono y se dejó el de un vecino o familiar. */
  contact: IFamilyContact | null;
  note: string | null;
  /** El jefe va primero; luego por nombre. */
  members: IFamilyMemberResource[];
}

/** Lo que se escribe al crear una familia. */
export interface IFamilyCreateInput {
  headId: string;
  contact: IFamilyContact | null;
  note: string | null;
}

/** Lo que se escribe al editar una familia: el jefe no cambia acá. */
export type IFamilyUpdateInput = Omit<IFamilyCreateInput, "headId">;

/** Lo que se escribe al agregar un integrante o cambiarle el parentesco. */
export interface IFamilyMemberInput {
  userId: string;
  relationship: EFamilyRelationship;
}
