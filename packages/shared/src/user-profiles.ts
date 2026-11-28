/**
 * Datos del censo de una persona (empadronamiento): DNI, fecha de nacimiento, género y
 * condiciones de prioridad. Todos opcionales. Son datos sensibles: solo los ven los admins y
 * nunca viajan en la lista de usuarios, solo en el detalle de uno.
 */
import { isIsoDate } from "./dates";
import type { IPersonName } from "./people";

export const DOCUMENT_NUMBER_LENGTH = 8;
export const CONDITION_NOTE_MAX_LENGTH = 500;

export const DOCUMENT_NUMBER_INVALID_MESSAGE = "El DNI tiene 8 dígitos.";
export const BIRTH_DATE_INVALID_MESSAGE = "Elige una fecha de nacimiento válida.";
export const BIRTH_DATE_FUTURE_MESSAGE = "La fecha de nacimiento no puede ser futura.";
export const GENDER_INVALID_MESSAGE = "Elige el género.";
export const CONDITION_INVALID_MESSAGE = "Hay una condición que no existe.";
export const CONDITION_NOTE_LENGTH_MESSAGE = "El detalle va hasta 500 letras.";

const DOCUMENT_NUMBER_PATTERN = /^\d{8}$/;

export const isValidDocumentNumber = (value: string): boolean => DOCUMENT_NUMBER_PATTERN.test(value);

/** Si es una fecha que existe y no es posterior a `today` (ambas «AAAA-MM-DD»). */
export const isValidBirthDate = (value: string, today: string): boolean =>
  isIsoDate(value) && value <= today;

export enum EGender {
  FEMALE = "FEMALE",
  MALE = "MALE",
}

export const genderLabels: Record<EGender, string> = {
  [EGender.FEMALE]: "Femenino",
  [EGender.MALE]: "Masculino",
};

/** Condiciones de prioridad. Sumar una es sumar una constante y su etiqueta. */
export enum EUserCondition {
  PREGNANT = "PREGNANT",
  POSTPARTUM = "POSTPARTUM",
  DISABILITY = "DISABILITY",
}

export const userConditionLabels: Record<EUserCondition, string> = {
  [EUserCondition.PREGNANT]: "Gestante",
  [EUserCondition.POSTPARTUM]: "Dio a luz recientemente",
  [EUserCondition.DISABILITY]: "Con discapacidad",
};

export const isGender = (value: string): value is EGender => value in genderLabels;
export const isUserCondition = (value: string): value is EUserCondition =>
  value in userConditionLabels;

/** Lo que viaja al crear o editar. `null` = sin dato. */
export interface IUserProfileInput {
  documentNumber: string | null;
  /** «AAAA-MM-DD». */
  birthDate: string | null;
  gender: EGender | null;
  conditions: EUserCondition[];
  conditionNote: string | null;
}

/** Los datos del censo tal como los devuelve la API. */
export type IUserProfile = IUserProfileInput;

export const EMPTY_USER_PROFILE: IUserProfile = {
  documentNumber: null,
  birthDate: null,
  gender: null,
  conditions: [],
  conditionNote: null,
};

/** Alguien que ya existe y se parece a lo que se está registrando. */
export interface IPersonMatchResource extends IPersonName {
  id: string;
}

/** Lo que devuelve la consulta de DNI (RENIEC) para autocompletar a una persona nueva. */
export interface IDocumentLookupResource {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  /** «AAAA-MM-DD», si vino. */
  birthDate: string | null;
  gender: EGender | null;
}
