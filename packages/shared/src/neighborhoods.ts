/**
 * Barrios de Samán (acordado 2026-11-07). Como las monedas en id-backend: viven en la tabla
 * `neighborhoods` (para la llave foránea) pero el código **nunca la consulta**: los lee de
 * acá, porque casi nunca cambian. Los IDs son UUID v7 fijos y los inserta la migración
 * `0001_seed_neighborhoods`; si se agrega un barrio, va acá **y** en una migración nueva.
 */

export interface INeighborhood {
  id: string;
  name: string;
}

export const NEIGHBORHOOD_IDS = {
  SANTA_ROSA: "01a1b5a4-1e79-77b7-a475-9eb90ece04fc",
  RAMON_CASTILLA: "01a1b5a4-1eb6-7718-ac25-f691ba91e2ad",
  MARIA_AUXILIADORA: "01a1b5a4-1eeb-7523-84f6-a36a72275e8f",
  EL_PATIO: "01a1b5a4-1f20-70ee-98d2-07b87a38869a",
  NUEVA_ESPERANZA: "01a1b5a4-1f55-72f2-9967-31f121e72497",
} as const;

/** En el orden en que se muestran en los selects. */
export const NEIGHBORHOODS: readonly INeighborhood[] = [
  { id: NEIGHBORHOOD_IDS.SANTA_ROSA, name: "Santa Rosa" },
  { id: NEIGHBORHOOD_IDS.RAMON_CASTILLA, name: "Ramón Castilla" },
  { id: NEIGHBORHOOD_IDS.MARIA_AUXILIADORA, name: "María Auxiliadora" },
  { id: NEIGHBORHOOD_IDS.EL_PATIO, name: "El Patio" },
  { id: NEIGHBORHOOD_IDS.NUEVA_ESPERANZA, name: "Nueva Esperanza" },
];

const NEIGHBORHOODS_BY_ID = new Map(NEIGHBORHOODS.map((neighborhood) => [neighborhood.id, neighborhood]));

export const NEIGHBORHOOD_INVALID_MESSAGE = "Elige un barrio de la lista.";

export const isKnownNeighborhood = (id: string): boolean => NEIGHBORHOODS_BY_ID.has(id);

/** El barrio de un ID; `null` si no tiene o si el ID no es de la lista. */
export const neighborhoodOf = (id: string | null): INeighborhood | null =>
  (id ? NEIGHBORHOODS_BY_ID.get(id) : undefined) ?? null;
