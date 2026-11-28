import { env } from "@juveco/env/server";
import { EGender, type IDocumentLookupResource } from "@juveco/shared/user-profiles";

/* Si id-pos tarda, se sigue a mano: no se deja a nadie esperando. */
const LOOKUP_TIMEOUT_MS = 6000;

interface IIdentificationDniResponse {
  success?: boolean;
  name?: string | null;
  fathers?: string | null;
  mothers?: string | null;
  birthday?: string | null;
  sex?: string | null;
}

const clean = (value: string | null | undefined): string => (value ?? "").replace(/\s+/g, " ").trim();

/* «1990-05-21», «21/05/1990» o «1990-05-21T…» → «1990-05-21». */
const toIsoDate = (value: string | null | undefined): string | null => {
  const text = clean(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const written = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  return written ? `${written[3]}-${written[2]}-${written[1]}` : null;
};

/* «F», «FEMENINO», «M», «MASCULINO»… */
const toGender = (value: string | null | undefined): EGender | null => {
  const first = clean(value).toUpperCase().charAt(0);
  return first === "F" ? EGender.FEMALE : first === "M" ? EGender.MALE : null;
};

/**
 * Consulta un DNI en el servicio de identificación de id-pos (el mismo que usa su formulario de
 * clientes: `GET {IDENTIFICATION}/search?type=dni&identification=…`, sin token).
 * Devuelve `null` si no está configurado, si no lo encuentra o si falla: la consulta nunca
 * bloquea el registro.
 */
export const lookupDocument = async (documentNumber: string): Promise<IDocumentLookupResource | null> => {
  /* El front de id-pos llama a este servicio con el axios global: sin token, solo con «I-Store». */
  const baseUrl = env.IDPOS_IDENTIFICATION_URL;
  if (!baseUrl) {
    console.warn("Consulta de DNI: falta IDPOS_IDENTIFICATION_URL");
    return null;
  }
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/search`);
  url.search = new URLSearchParams({ type: "dni", identification: documentNumber, cache: "1" }).toString();
  /* Sin `Authorization`: un token vencido hace que el servicio responda 401 (como en id-pos, no lleva). */
  const headers: Record<string, string> = { Accept: "application/json" };
  if (env.IDPOS_STORE_ID) {
    headers["I-Store"] = env.IDPOS_STORE_ID;
  }

  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) });
    const body = await response.text();
    if (!response.ok) {
      console.warn(`Consulta de DNI: id-pos respondió ${response.status}: ${body.slice(0, 300)}`);
      return null;
    }
    const raw = JSON.parse(body) as IIdentificationDniResponse | { data?: IIdentificationDniResponse };
    const data: IIdentificationDniResponse = "data" in raw && raw.data ? raw.data : (raw as IIdentificationDniResponse);
    const firstName = clean(data.name);
    const paternalLastName = clean(data.fathers);
    const maternalLastName = clean(data.mothers);
    if (data.success === false || (!firstName && !paternalLastName)) {
      console.warn(`Consulta de DNI: sin datos para ese DNI: ${body.slice(0, 300)}`);
      return null;
    }
    return {
      firstName,
      paternalLastName,
      maternalLastName,
      birthDate: toIsoDate(data.birthday),
      gender: toGender(data.sex),
    };
  } catch (error) {
    console.warn("Consulta de DNI: id-pos no respondió", error);
    return null;
  }
};
