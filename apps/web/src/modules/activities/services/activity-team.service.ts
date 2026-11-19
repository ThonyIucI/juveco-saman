import type { IActivityItemPaymentInput, IPaymentChange } from "@juveco/shared/activity-item-payments";
import type {
  IActivityTeamInput,
  IActivityTeamPaymentResource,
  IActivityTeamResource,
} from "@juveco/shared/activity-teams";

import { apiRequest } from "@/lib/api";

export type TTeamPaymentChange = IPaymentChange<IActivityTeamResource, IActivityTeamPaymentResource>;

const teamsPath = (activityId: string) => `/activities/${activityId}/teams`;
const paymentsPath = (activityId: string, teamId: string) => `${teamsPath(activityId)}/${teamId}/payments`;

/** Los equipos de un campeonato, en el orden en que se inscribieron. */
export const listActivityTeamsRequest = (activityId: string, signal?: AbortSignal) =>
  apiRequest<IActivityTeamResource[]>(teamsPath(activityId), { signal });

/** La inscripción la pone la API: el precio de la actividad. */
export const createActivityTeamRequest = (activityId: string, payload: IActivityTeamInput) =>
  apiRequest<IActivityTeamResource>(teamsPath(activityId), { method: "POST", body: payload });

/** Se manda completo: los jugadores se reemplazan por la lista nueva. */
export const updateActivityTeamRequest = (activityId: string, teamId: string, payload: IActivityTeamInput) =>
  apiRequest<IActivityTeamResource>(`${teamsPath(activityId)}/${teamId}`, { method: "PATCH", body: payload });

export const deleteActivityTeamRequest = (activityId: string, teamId: string) =>
  apiRequest<{ id: string }>(`${teamsPath(activityId)}/${teamId}`, { method: "DELETE" });

/** Los pagos de la inscripción, del primero al último. */
export const listTeamPaymentsRequest = (activityId: string, teamId: string, signal?: AbortSignal) =>
  apiRequest<IActivityTeamPaymentResource[]>(paymentsPath(activityId, teamId), { signal });

/** Devuelve el pago y el equipo con lo pagado al día. */
export const createTeamPaymentRequest = (activityId: string, teamId: string, payload: IActivityItemPaymentInput) =>
  apiRequest<TTeamPaymentChange>(paymentsPath(activityId, teamId), { method: "POST", body: payload });

export const deleteTeamPaymentRequest = (activityId: string, teamId: string, paymentId: string) =>
  apiRequest<TTeamPaymentChange>(`${paymentsPath(activityId, teamId)}/${paymentId}`, { method: "DELETE" });
