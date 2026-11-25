import type { IPublicHome } from "@juveco/shared/public";

import { apiRequest } from "@/lib/api";

/** La portada: no pide sesión. */
export const getPublicHomeRequest = (signal?: AbortSignal) => apiRequest<IPublicHome>("/public/home", { signal });
