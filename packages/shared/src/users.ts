import type { INeighborhood } from "./neighborhoods";
import type { IPersonInput } from "./people";
import type { TUserRole } from "./roles";

/** Una persona tal como la devuelve la API. Nunca incluye la contraseña. */
export interface IUserResource extends Omit<IPersonInput, "neighborhoodId"> {
  id: string;
  /** El barrio resuelto desde las constantes; `null` si no tiene. */
  neighborhood: INeighborhood | null;
  role: TUserRole;
  /** El correo con el que entra; `null` si no tiene acceso. */
  email: string | null;
  createdAt: string;
}

export const USER_MIN_PASSWORD_LENGTH = 8;
