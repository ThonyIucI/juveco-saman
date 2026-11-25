import type {
  IActivityBalance,
  IActivityExpenseInput,
  IActivityExpenseResource,
} from "@juveco/shared/activity-expenses";
import type {
  IActivityPrizeInput,
  IActivityPrizeResource,
  IPrizeWinnerInput,
} from "@juveco/shared/activity-prizes";

import { apiRequest } from "@/lib/api";
import { type TMovementKind, movementLabels } from "@/modules/activities/utils/movements";

const prizesPath = (activityId: string) => `/activities/${activityId}/prizes`;

export const listActivityPrizesRequest = (activityId: string, signal?: AbortSignal) =>
  apiRequest<IActivityPrizeResource[]>(prizesPath(activityId), { signal });

export const createActivityPrizeRequest = (activityId: string, payload: IActivityPrizeInput) =>
  apiRequest<IActivityPrizeResource>(prizesPath(activityId), { method: "POST", body: payload });

/** Se manda el premio completo: donado/comprado se valida junto con lo suyo. */
export const updateActivityPrizeRequest = (prize: IActivityPrizeResource, payload: IActivityPrizeInput) =>
  apiRequest<IActivityPrizeResource>(`${prizesPath(prize.activityId)}/${prize.id}`, {
    method: "PATCH",
    body: payload,
  });

/** La cartilla ganadora; `null` la quita. */
export const setPrizeWinnerRequest = (prize: IActivityPrizeResource, payload: IPrizeWinnerInput) =>
  apiRequest<IActivityPrizeResource>(`${prizesPath(prize.activityId)}/${prize.id}/winner`, {
    method: "PUT",
    body: payload,
  });

export const deleteActivityPrizeRequest = (prize: IActivityPrizeResource) =>
  apiRequest<{ id: string }>(`${prizesPath(prize.activityId)}/${prize.id}`, { method: "DELETE" });

/* Ingresos y gastos van por la misma forma: cambia solo el tramo de la ruta. */
const movementsPath = (kind: TMovementKind, activityId: string) =>
  `/activities/${activityId}/${movementLabels[kind].path}`;

export const listActivityMovementsRequest = (kind: TMovementKind, activityId: string, signal?: AbortSignal) =>
  apiRequest<IActivityExpenseResource[]>(movementsPath(kind, activityId), { signal });

export const createActivityMovementRequest = (
  kind: TMovementKind,
  activityId: string,
  payload: IActivityExpenseInput,
) =>
  apiRequest<IActivityExpenseResource>(movementsPath(kind, activityId), { method: "POST", body: payload });

export const updateActivityMovementRequest = (
  kind: TMovementKind,
  movement: IActivityExpenseResource,
  payload: IActivityExpenseInput,
) =>
  apiRequest<IActivityExpenseResource>(`${movementsPath(kind, movement.activityId)}/${movement.id}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteActivityMovementRequest = (kind: TMovementKind, movement: IActivityExpenseResource) =>
  apiRequest<{ id: string }>(`${movementsPath(kind, movement.activityId)}/${movement.id}`, { method: "DELETE" });

/** Ingresos (cobrado y esperado) menos premios comprados y gastos. */
export const getActivityBalanceRequest = (activityId: string, signal?: AbortSignal) =>
  apiRequest<IActivityBalance>(`/activities/${activityId}/balance`, { signal });
