import type { IActivityTeamPaymentResource } from "@juveco/shared/activity-teams";

import { useRequest } from "@/common/hooks/use-request";
import { listTeamPaymentsRequest } from "@/modules/activities/services/activity-team.service";

/** Los pagos de la inscripción de un equipo. `onRemove` lo saca sin esperar a recargar. */
export const useListTeamPayments = () => {
  const request = useRequest<IActivityTeamPaymentResource[]>();

  const handler = (activityId: string, teamId: string, signal?: AbortSignal) =>
    request.handleRequest(() => listTeamPaymentsRequest(activityId, teamId, signal));

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((payment) => payment.id !== id));

  return { payments: request.data ?? [], loading: request.loading, handler, onRemove };
};
