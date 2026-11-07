/** Sobre estándar de toda respuesta de la API. */
export interface IApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface IPaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface IPaginatedData<T> {
  data: T[];
  meta: IPaginationMeta;
}

/** Prefijo de todos los endpoints de la app (better-auth vive aparte en /api/auth). */
export const API_PREFIX = "/api/v1";
