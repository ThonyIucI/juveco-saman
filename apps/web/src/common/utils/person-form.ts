import {
  FIRST_NAME_LENGTH_MESSAGE,
  type IPersonInput,
  LAST_NAME_LENGTH_MESSAGE,
  PERSON_NAME_MAX_LENGTH,
  PERSON_NAME_MIN_LENGTH,
  PERSON_NOTE_LENGTH_MESSAGE,
  PERSON_NOTE_MAX_LENGTH,
} from "@juveco/shared/people";
import { DEFAULT_COUNTRY_PREFIX, type IPhone, phoneError } from "@juveco/shared/phones";
import type { IUserResource } from "@juveco/shared/users";
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

export const EMPTY_PHONE: IPhone = { countryPrefix: DEFAULT_COUNTRY_PREFIX, number: "" };

export const personFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(PERSON_NAME_MIN_LENGTH, FIRST_NAME_LENGTH_MESSAGE)
    .max(PERSON_NAME_MAX_LENGTH, FIRST_NAME_LENGTH_MESSAGE),
  lastName: z.string().trim().max(PERSON_NAME_MAX_LENGTH, LAST_NAME_LENGTH_MESSAGE),
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
});

export type TPersonFormValues = z.input<typeof personFormSchema>;

/** Lo que llega ya escrito al crear desde un buscador («Crear «Ana»»), o el último barrio. */
export interface IPersonInitialValues {
  firstName?: string;
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

export const buildPersonDefaults = (
  user?: IUserResource,
  initialValues?: IPersonInitialValues,
): TPersonFormValues => ({
  firstName: user?.firstName ?? initialValues?.firstName ?? "",
  lastName: user?.lastName ?? "",
  neighborhoodId: user ? (user.neighborhood?.id ?? "") : (initialValues?.neighborhoodId ?? ""),
  phone: user?.phone ?? initialValues?.phone ?? EMPTY_PHONE,
  whatsappUsername: user?.whatsappUsername ?? "",
  note: user?.note ?? "",
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
  lastName: value.lastName.trim() || null,
  neighborhoodId: value.neighborhoodId || null,
  phone: value.phone.number ? value.phone : null,
  whatsappUsername: toWhatsAppUsername(value.whatsappUsername) || null,
  note: value.note.trim() || null,
});
