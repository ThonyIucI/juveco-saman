import type { TPhoneInput } from "./phone-input";
import { conflict } from "./errors";

/**
 * Antes de guardar se busca quién ya tiene ese número o usuario, para responder con su
 * nombre en vez del error genérico del índice único. `exceptId`: al editar, la misma persona
 * no choca consigo.
 */
interface IPersonMatch {
  id: string;
  label: string;
}

type TFindByPhone = (phone: NonNullable<TPhoneInput>) => Promise<IPersonMatch | undefined>;
type TFindByUsername = (usernameLower: string) => Promise<IPersonMatch | undefined>;

export const assertPhoneAvailable = async ({
  phone,
  findByPhone,
  exceptId,
}: {
  phone: TPhoneInput | undefined;
  findByPhone: TFindByPhone;
  exceptId?: string;
}) => {
  if (!phone) {
    return;
  }
  const existing = await findByPhone(phone);
  if (existing && existing.id !== exceptId) {
    throw conflict(`«${existing.label}» ya tiene ese número.`);
  }
};

export const assertUsernameAvailable = async ({
  username,
  findByUsername,
  exceptId,
}: {
  username: string | null | undefined;
  findByUsername: TFindByUsername;
  exceptId?: string;
}) => {
  if (!username) {
    return;
  }
  const existing = await findByUsername(username.toLowerCase());
  if (existing && existing.id !== exceptId) {
    throw conflict(`«${existing.label}» ya tiene ese usuario de WhatsApp.`);
  }
};
