import type { TUserRole } from "@juveco/shared/roles";
import type { IUserResource } from "@juveco/shared/users";

/** Filtros de la lista de usuarios (Thony, 2026-11-09). Vacío es «todos». */
export interface IUserFilters {
  role: TUserRole | "";
  neighborhoodId: string;
}

export const EMPTY_USER_FILTERS: IUserFilters = { role: "", neighborhoodId: "" };

/** Cuántos filtros hay puestos, para el globo del botón de filtros. */
export const countActiveUserFilters = (filters: IUserFilters): number =>
  Object.values(filters).filter((value) => value !== "").length;

export const matchesUserFilters = (user: IUserResource, filters: IUserFilters): boolean =>
  (!filters.role || user.role === filters.role) &&
  (!filters.neighborhoodId || user.neighborhood?.id === filters.neighborhoodId);
