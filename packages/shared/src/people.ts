/**
 * Datos de una persona (acordado 2026-11-07): nombres, apellidos, barrio y cómo escribirle
 * por WhatsApp (número o usuario).
 */
import type { IPhone } from "./phones";

export const PERSON_NAME_MIN_LENGTH = 2;
export const PERSON_NAME_MAX_LENGTH = 60;
export const PERSON_NOTE_MAX_LENGTH = 200;

export const FIRST_NAME_LENGTH_MESSAGE = "Los nombres van de 2 a 60 letras.";
export const PATERNAL_LAST_NAME_LENGTH_MESSAGE = "El apellido paterno va hasta 60 letras.";
export const MATERNAL_LAST_NAME_LENGTH_MESSAGE = "El apellido materno va hasta 60 letras.";
export const PERSON_NOTE_LENGTH_MESSAGE = "La nota va hasta 200 letras.";

/** Cómo se llama una persona: nombres y los dos apellidos por separado. */
export interface IPersonName {
  firstName: string;
  /** `null` si no se sabe. */
  paternalLastName: string | null;
  /** `null` si no se sabe. */
  maternalLastName: string | null;
}

/** Lo que se escribe en el formulario y viaja al crear o editar. */
export interface IPersonInput extends IPersonName {
  /** Uno de `NEIGHBORHOODS`; `null` si no se sabe. */
  neighborhoodId: string | null;
  /** Su número de WhatsApp. `null` si no lo tiene. */
  phone: IPhone | null;
  /** Su usuario de WhatsApp, sin «@». `null` si no lo tiene. */
  whatsappUsername: string | null;
  note: string | null;
}

/** «Ana» + «Pérez» + «Ruiz» → «Ana Pérez Ruiz». Sin apellidos, solo los nombres. */
export const fullName = (person: IPersonName): string =>
  [person.firstName, person.paternalLastName, person.maternalLastName].filter(Boolean).join(" ");

