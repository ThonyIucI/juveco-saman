import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { IApiResponse, IPaginatedData, IPaginationMeta } from "@juveco/shared/api";

/** Respuesta exitosa con el sobre estándar `{ success, data, error }`. */
export const ok = <T>(context: Context, data: T, status: ContentfulStatusCode = 200) =>
  context.json<IApiResponse<T>>({ success: true, data, error: null }, status);

/** Respuesta de error con el sobre estándar. El mensaje siempre es legible, sin IDs técnicos. */
export const fail = (context: Context, message: string, status: ContentfulStatusCode) =>
  context.json<IApiResponse<null>>({ success: false, data: null, error: message }, status);

export const paginated = <T>(items: T[], meta: IPaginationMeta): IPaginatedData<T> => ({
  data: items,
  meta,
});
