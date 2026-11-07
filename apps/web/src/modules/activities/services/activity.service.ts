import type { IActivityResource } from "@juveco/shared/activities";
import type { IActivityItemInput, IActivityItemResource } from "@juveco/shared/activity-items";

import { apiRequest } from "@/lib/api";

export type TUpdateActivityItemPayload = Partial<IActivityItemInput>;

/** Todas las actividades, la más próxima primero. */
export const listActivitiesRequest = (signal?: AbortSignal) =>
  apiRequest<IActivityResource[]>("/activities", { signal });

export const getActivityRequest = (id: string, signal?: AbortSignal) =>
  apiRequest<IActivityResource>(`/activities/${id}`, { signal });

/** Lo vendido en una actividad (en un bingo, las cartillas). */
export const listActivityItemsRequest = (activityId: string, signal?: AbortSignal) =>
  apiRequest<IActivityItemResource[]>(`/activities/${activityId}/items`, { signal });

/** Quien vende es el administrador de la sesión: no se manda. */
export const createActivityItemRequest = (activityId: string, payload: IActivityItemInput) =>
  apiRequest<IActivityItemResource>(`/activities/${activityId}/items`, { method: "POST", body: payload });

interface IUpdateActivityItemParams {
  activityId: string;
  itemId: string;
  payload: TUpdateActivityItemPayload;
}

export const updateActivityItemRequest = ({ activityId, itemId, payload }: IUpdateActivityItemParams) =>
  apiRequest<IActivityItemResource>(`/activities/${activityId}/items/${itemId}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteActivityItemRequest = (activityId: string, itemId: string) =>
  apiRequest<{ id: string }>(`/activities/${activityId}/items/${itemId}`, { method: "DELETE" });
