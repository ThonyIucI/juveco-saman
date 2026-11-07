import type { IActivityResource } from "@juveco/shared/activities";
import type {
  IActivityItemPaymentInput,
  IActivityItemPaymentResource,
  IActivitySummary,
  IPaymentChange,
} from "@juveco/shared/activity-item-payments";
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

const paymentsPath = (activityId: string, itemId: string) =>
  `/activities/${activityId}/items/${itemId}/payments`;

/** Los pagos de un ítem, del primero al último. */
export const listItemPaymentsRequest = (activityId: string, itemId: string, signal?: AbortSignal) =>
  apiRequest<IActivityItemPaymentResource[]>(paymentsPath(activityId, itemId), { signal });

/** Quien cobra es el administrador de la sesión. Devuelve el pago y el ítem con lo pagado al día. */
export const createItemPaymentRequest = (activityId: string, itemId: string, payload: IActivityItemPaymentInput) =>
  apiRequest<IPaymentChange<IActivityItemResource>>(paymentsPath(activityId, itemId), {
    method: "POST",
    body: payload,
  });

export const deleteItemPaymentRequest = (activityId: string, itemId: string, paymentId: string) =>
  apiRequest<IPaymentChange<IActivityItemResource>>(`${paymentsPath(activityId, itemId)}/${paymentId}`, {
    method: "DELETE",
  });

/** Los números de los KPIs: vendidos, recaudado (por Yape y efectivo) y por cobrar. */
export const getActivitySummaryRequest = (activityId: string, signal?: AbortSignal) =>
  apiRequest<IActivitySummary>(`/activities/${activityId}/summary`, { signal });
