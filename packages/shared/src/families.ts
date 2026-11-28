/**
 * Familias de una vivienda (empadronamiento). En una vivienda pueden vivir varias familias; cada
 * una tiene su jefe de hogar, que es su contacto, y sus integrantes con su parentesco respecto
 * al jefe. Una persona (usuario) integra a lo sumo una familia.
 */
import type { INeighborhood } from "./neighborhoods";
import type { IPersonInput, IPersonName } from "./people";
import type { IPhone } from "./phones";
import type { EGender, EUserCondition, IUserProfileInput } from "./user-profiles";

export const FAMILY_CONTACT_NAME_MAX_LENGTH = 120;

/** Cuántas personas caben en un solo «Agregar integrantes». */
export const MEMBERS_BATCH_MAX = 20;

/** En `familyId`: la persona va en una familia nueva de la vivienda. */
export const NEW_FAMILY = "NEW";

export const FAMILY_MEMBER_REQUIRED_MESSAGE = "Elige a la persona o escribe sus datos.";
export const FAMILY_RELATIONSHIP_INVALID_MESSAGE = "Elige el parentesco.";
export const FAMILY_NOT_CHOSEN_MESSAGE = "Elige a qué familia de la vivienda pertenece.";
export const FAMILY_CONTACT_NAME_LENGTH_MESSAGE = "El nombre del contacto va hasta 120 letras.";
export const FAMILY_CONTACT_NAME_REQUIRED_MESSAGE = "Escribe a quién pertenece ese número.";
export const FAMILY_CONTACT_PHONE_REQUIRED_MESSAGE = "Escribe el número del contacto.";
export const MEMBERS_BATCH_EMPTY_MESSAGE = "Agrega al menos un integrante.";
export const MEMBERS_BATCH_TOO_MANY_MESSAGE = `Se pueden agregar hasta ${MEMBERS_BATCH_MAX} integrantes a la vez.`;
export const MEMBERS_BATCH_DUPLICATE_MESSAGE = "Hay una persona repetida en la lista.";
export const MEMBERS_BATCH_ONE_HEAD_MESSAGE = "Solo una persona puede ser jefe(a) de hogar.";

/** El jefe no se quita ni se deja de marcar como jefe sin que otro tome su lugar. */
export const headRemoveBlockedMessage = (name: string): string =>
  `Marca a otro integrante como jefe antes de quitar a ${name}.`;
export const headChangeBlockedMessage = (name: string): string =>
  `Marca a otro integrante como jefe antes de cambiar a ${name}.`;

/** El aviso al cambiar de jefe: los demás parentescos pueden quedar desactualizados. */
export const formerHeadReviewMessage = (name: string): string => `Revisa el parentesco de ${name}`;

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

/** Al pasar el jefe a otra persona, el anterior queda con este parentesco. */
export const FORMER_HEAD_RELATIONSHIP = EFamilyRelationship.OTHER_RELATIVE;

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

/** «Familia Quispe Mamani»: los apellidos del jefe; sin ellos, «Familia de Rosa». */
export const familyNameOf = (head: IPersonName | undefined): string => {
  if (!head) {
    return "Familia";
  }
  const surnames = [head.paternalLastName, head.maternalLastName].filter(Boolean).join(" ");
  return surnames ? `Familia ${surnames}` : `Familia de ${head.firstName}`;
};

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
  /** DNI; `null` si no tiene o no se sabe. */
  documentNumber: string | null;
  gender: EGender | null;
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
  /** El jefe va primero; luego por nombre. */
  members: IFamilyMemberResource[];
}

/** Lo que se escribe al guardar una persona como integrante (alta o edición). */
export interface IFamilyMemberSaveInput {
  /** Una persona que ya existe; sin ella, se crea con `person`. */
  userId?: string;
  /** Sus datos: con `userId` se actualizan, sin él se crea. */
  person?: IPersonInput & { details?: IUserProfileInput };
  /** El id de una familia de la vivienda o `NEW_FAMILY`. Sin él: la única familia, o una nueva si no hay. */
  familyId?: string;
  isHead: boolean;
  /** Respecto al jefe; solo cuando no es jefe. */
  relationship?: EFamilyRelationship;
  /** Solo si es jefe y no tiene teléfono. */
  contact: IFamilyContact | null;
}

/** Una fila de «Agregar integrantes»: una persona que ya existe y su lugar en la familia. */
export interface IFamilyMembersBatchItem {
  userId: string;
  isHead: boolean;
  /** Respecto al jefe; solo cuando no es jefe. */
  relationship?: EFamilyRelationship;
}

/** Varias personas a la vez, en una sola escritura: o entran todas o no entra ninguna. */
export interface IFamilyMembersBatchInput {
  /** El id de una familia de la vivienda o `NEW_FAMILY`. Sin él: la única familia, o una nueva si no hay. */
  familyId?: string;
  members: IFamilyMembersBatchItem[];
  /** Solo si el jefe de la lista no tiene teléfono. */
  contact: IFamilyContact | null;
}

/** Al editar, la persona y la familia ya están definidas. */
export type IFamilyMemberUpdateInput = Omit<IFamilyMemberSaveInput, "userId" | "familyId">;
