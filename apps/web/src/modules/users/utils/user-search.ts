import type { IUserResource } from "@juveco/shared/users";
import { fullName } from "@juveco/shared/people";

/**
 * Busca por nombres y apellidos, barrio, número (con o sin espacios), usuario (con o sin «@»)
 * y nota. `term` ya viene sin espacios en los bordes y en minúsculas. Lo usan el listado de
 * Usuarios y el buscador de personas (`UserSearch`).
 */
export const matchesUserSearch = (user: IUserResource, term: string): boolean => {
  const digits = term.replace(/\D/g, "");
  const username = term.replace(/^@/, "");
  const phone = user.phone ? `${user.phone.countryPrefix}${user.phone.number}` : "";
  return (
    fullName(user).toLowerCase().includes(term) ||
    (user.neighborhood?.name.toLowerCase().includes(term) ?? false) ||
    (user.note?.toLowerCase().includes(term) ?? false) ||
    (username.length > 0 && (user.whatsappUsername?.toLowerCase().includes(username) ?? false)) ||
    (digits.length > 0 && phone.includes(digits))
  );
};

/** Si lo escrito parece un número (para llenar el número al crear desde el buscador). */
export const looksLikePhone = (term: string): boolean => /^\+?[\d\s-]{6,}$/.test(term.trim());
