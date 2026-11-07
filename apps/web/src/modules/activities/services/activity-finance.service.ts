import type {
  IActivityBalance,
  IActivityExpenseInput,
  IActivityExpenseResource,
} from "@juveco/shared/activity-expenses";
import type { IActivityPrizeInput, IActivityPrizeResource } from "@juveco/shared/activity-prizes";

import { apiRequest } from "@/lib/api";

const prizesPath = (activityId: string) => `/activities/${activityId}/prizes`;
const expensesPath = (activityId: string) => `/activities/${activityId}/expenses`;

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

export const deleteActivityPrizeRequest = (prize: IActivityPrizeResource) =>
  apiRequest<{ id: string }>(`${prizesPath(prize.activityId)}/${prize.id}`, { method: "DELETE" });

export const listActivityExpensesRequest = (activityId: string, signal?: AbortSignal) =>
  apiRequest<IActivityExpenseResource[]>(expensesPath(activityId), { signal });

export const createActivityExpenseRequest = (activityId: string, payload: IActivityExpenseInput) =>
  apiRequest<IActivityExpenseResource>(expensesPath(activityId), { method: "POST", body: payload });

export const updateActivityExpenseRequest = (expense: IActivityExpenseResource, payload: IActivityExpenseInput) =>
  apiRequest<IActivityExpenseResource>(`${expensesPath(expense.activityId)}/${expense.id}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteActivityExpenseRequest = (expense: IActivityExpenseResource) =>
  apiRequest<{ id: string }>(`${expensesPath(expense.activityId)}/${expense.id}`, { method: "DELETE" });

/** Ingresos (cobrado y esperado) menos premios comprados y gastos. */
export const getActivityBalanceRequest = (activityId: string, signal?: AbortSignal) =>
  apiRequest<IActivityBalance>(`/activities/${activityId}/balance`, { signal });
