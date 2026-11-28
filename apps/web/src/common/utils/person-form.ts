import { isIsoDate, todayInLima } from "@juveco/shared/dates";
import {
  FIRST_NAME_LENGTH_MESSAGE,
  type IPersonInput,
  MATERNAL_LAST_NAME_LENGTH_MESSAGE,
  PATERNAL_LAST_NAME_LENGTH_MESSAGE,
  PERSON_NAME_MAX_LENGTH,
  PERSON_NAME_MIN_LENGTH,
  PERSON_NOTE_LENGTH_MESSAGE,
  PERSON_NOTE_MAX_LENGTH,
} from "@juveco/shared/people";
import {
  BIRTH_DATE_FUTURE_MESSAGE,
  BIRTH_DATE_INVALID_MESSAGE,
  CONDITION_NOTE_LENGTH_MESSAGE,
  CONDITION_NOTE_MAX_LENGTH,
  DOCUMENT_NUMBER_INVALID_MESSAGE,
  type EGender,
  type EUserCondition,
  type IUserProfile,
  type IUserProfileInput,
  isGender,
  isValidDocumentNumber,
} from "@juveco/shared/user-profiles";
import { DEFAULT_COUNTRY_PREFIX, type IPhone, phoneError } from "@juveco/shared/phones";
import type { IUserDetailResource, IUserResource } from "@juveco/shared/users";
import {
  WHATSAPP_USERNAME_INVALID_MESSAGE,
  WHATSAPP_USERNAME_MAX_LENGTH,
  isValidWhatsAppUsername,
  toWhatsAppUsername,
} from "@juveco/shared/whatsapp";
import z from "zod";

/**
 * El formulario de una persona: sus campos, su validación, sus valores iniciales y cómo se
 * mandan a la API.
 */

/* La «@» del principio no cuenta para el largo: se guarda sin ella. */
export const USERNAME_INPUT_MAX_LENGTH = WHATSAPP_USERNAME_MAX_LENGTH + 1;

const WRITTEN_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const WRITTEN_DATE_LENGTH = 10;

/** «05/11/2026» → «2026-11-05»; `null` si no es una fecha que existe. */
export const writtenDateToIso = (text: string): string | null => {
  const match = WRITTEN_DATE_PATTERN.exec(text.trim());
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  return isIsoDate(iso) ? iso : null;
};

/** «2026-11-05» → «05/11/2026». */
export const isoToWrittenDate = (iso: string): string => {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

/** Solo dígitos, con las barras puestas solas: «05112026» → «05/11/2026». */
export const formatWrittenDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean);
  return parts.join("/");
};

/* Vacía es válida; incompleta o inexistente no; y no puede ser futura. */
const birthDateError = (text: string): string | null => {
  if (text === "") {
    return null;
  }
  const iso = text.length === WRITTEN_DATE_LENGTH ? writtenDateToIso(text) : null;
  if (!iso) {
    return BIRTH_DATE_INVALID_MESSAGE;
  }
  return iso > todayInLima() ? BIRTH_DATE_FUTURE_MESSAGE : null;
};

export const EMPTY_PHONE: IPhone = { countryPrefix: DEFAULT_COUNTRY_PREFIX, number: "" };

export const personFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(PERSON_NAME_MIN_LENGTH, FIRST_NAME_LENGTH_MESSAGE)
    .max(PERSON_NAME_MAX_LENGTH, FIRST_NAME_LENGTH_MESSAGE),
  paternalLastName: z.string().trim().max(PERSON_NAME_MAX_LENGTH, PATERNAL_LAST_NAME_LENGTH_MESSAGE),
  maternalLastName: z.string().trim().max(PERSON_NAME_MAX_LENGTH, MATERNAL_LAST_NAME_LENGTH_MESSAGE),
  /* "" = sin barrio. El select solo ofrece los de la lista. */
  neighborhoodId: z.string(),
  /* El número es opcional; si se escribe, tiene que servir para ese país. */
  phone: z.object({ countryPrefix: z.string(), number: z.string() }).superRefine((phone, context) => {
    const message = phone.number ? phoneError(phone.countryPrefix, phone.number) : null;
    if (message) {
      context.addIssue({ code: "custom", message });
    }
  }),
  /* Opcional, con o sin «@». */
  whatsappUsername: z.string().refine((value) => {
    const username = toWhatsAppUsername(value);
    return username === "" || isValidWhatsAppUsername(username);
  }, WHATSAPP_USERNAME_INVALID_MESSAGE),
  note: z.string().max(PERSON_NOTE_MAX_LENGTH, PERSON_NOTE_LENGTH_MESSAGE),
  /* Datos del censo, todos opcionales. */
  documentNumber: z
    .string()
    .trim()
    .refine((value) => value === "" || isValidDocumentNumber(value), DOCUMENT_NUMBER_INVALID_MESSAGE),
  /* Como se escribe: «día/mes/año». */
  birthDate: z.string().superRefine((value, context) => {
    const message = birthDateError(value);
    if (message) {
      context.addIssue({ code: "custom", message });
    }
  }),
  /* "" = sin género. */
  gender: z.string(),
  conditions: z.array(z.string()),
  conditionNote: z.string().max(CONDITION_NOTE_MAX_LENGTH, CONDITION_NOTE_LENGTH_MESSAGE),
});

export type TPersonFormValues = z.input<typeof personFormSchema>;

/** Lo que llega ya escrito al crear desde un buscador («Crear «Ana»»), o el último barrio. */
export interface IPersonInitialValues {
  firstName?: string;
  /** Un DNI ya escrito en el buscador. */
  documentNumber?: string;
  neighborhoodId?: string;
  /** Ya separado en prefijo y número: «+51 987…» no puede quedar como «51987…». */
  phone?: IPhone;
}

/*
  El último barrio con que se creó una persona: por lo general se cargan varias seguidas del
  mismo barrio (Thony, 2026-11-08). En `localStorage` y por administrador: sobrevive a recargar
  y a cerrar sesión, y quien entra en el mismo navegador no hereda el de otro. Si el
  navegador lo bloquea, simplemente arranca sin barrio.
*/
const LAST_NEIGHBORHOOD_KEY = "juveco:last-neighborhood:";

export const readLastNeighborhood = (personId: string): string => {
  try {
    return localStorage.getItem(`${LAST_NEIGHBORHOOD_KEY}${personId}`) ?? "";
  } catch {
    return "";
  }
};

/** Solo se recuerda un barrio usado: crear a alguien sin barrio no borra el anterior. */
export const rememberNeighborhood = (personId: string, neighborhoodId: string | null | undefined): void => {
  if (!neighborhoodId) {
    return;
  }
  try {
    localStorage.setItem(`${LAST_NEIGHBORHOOD_KEY}${personId}`, neighborhoodId);
  } catch {
    /* Sin almacenamiento disponible no se recuerda: no es un error para quien carga. */
  }
};

/** Los campos del censo del formulario, desde los datos guardados (o vacíos). */
export const buildDetailsDefaults = (details?: IUserProfile) => ({
  documentNumber: details?.documentNumber ?? "",
  birthDate: details?.birthDate ? isoToWrittenDate(details.birthDate) : "",
  gender: details?.gender ?? "",
  conditions: details?.conditions ?? [],
  conditionNote: details?.conditionNote ?? "",
});

/** `user` con `details` (de `GET /users/:id`) llena también el censo. */
export const buildPersonDefaults = (
  user?: IUserResource | IUserDetailResource,
  initialValues?: IPersonInitialValues,
): TPersonFormValues => ({
  firstName: user?.firstName ?? initialValues?.firstName ?? "",
  paternalLastName: user?.paternalLastName ?? "",
  maternalLastName: user?.maternalLastName ?? "",
  neighborhoodId: user ? (user.neighborhood?.id ?? "") : (initialValues?.neighborhoodId ?? ""),
  phone: user?.phone ?? initialValues?.phone ?? EMPTY_PHONE,
  whatsappUsername: user?.whatsappUsername ?? "",
  note: user?.note ?? "",
  ...buildDetailsDefaults(user && "details" in user ? user.details : undefined),
  documentNumber:
    user && "details" in user ? (user.details.documentNumber ?? "") : (initialValues?.documentNumber ?? ""),
});

/** Cómo se muestra el WhatsApp en el formulario: un solo campo a la vez. */
export type TWhatsAppMode = "phone" | "username";

/** Número si lo tiene (o si no tiene ninguno); usuario solo si no hay número. */
export const initialWhatsAppMode = (values: TPersonFormValues): TWhatsAppMode => {
  const hasOnlyUsername = values.phone.number === "" && values.whatsappUsername !== "";
  return hasOnlyUsername ? "username" : "phone";
};

/** Los textos vacíos viajan como `null`. */
export const toPersonPayload = (value: TPersonFormValues): IPersonInput => ({
  firstName: value.firstName.trim(),
  paternalLastName: value.paternalLastName.trim() || null,
  maternalLastName: value.maternalLastName.trim() || null,
  neighborhoodId: value.neighborhoodId || null,
  phone: value.phone.number ? value.phone : null,
  whatsappUsername: toWhatsAppUsername(value.whatsappUsername) || null,
  note: value.note.trim() || null,
});

/** Los datos del censo del formulario, como viajan a la API. */
export const toDetailsPayload = (value: TPersonFormValues): IUserProfileInput => ({
  documentNumber: value.documentNumber.trim() || null,
  birthDate: writtenDateToIso(value.birthDate),
  gender: isGender(value.gender) ? (value.gender as EGender) : null,
  conditions: value.conditions as EUserCondition[],
  conditionNote: value.conditionNote.trim() || null,
});

/** Si se escribió algún dato del censo (al crear, solo entonces se manda `details`). */
export const hasDetailsData = (value: TPersonFormValues): boolean =>
  value.documentNumber.trim() !== "" ||
  value.birthDate !== "" ||
  value.gender !== "" ||
  value.conditions.length > 0 ||
  value.conditionNote.trim() !== "";
