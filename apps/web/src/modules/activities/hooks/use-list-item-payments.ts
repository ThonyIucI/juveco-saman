import type { IActivityItemPaymentResource } from "@juveco/shared/activity-item-payments";

import { useRequest } from "@/common/hooks/use-request";
import { listItemPaymentsRequest } from "@/modules/activities/services/activity.service";

/** Los pagos de un ítem. `onRemove` lo saca de la lista sin esperar a recargar. */
export const useListItemPayments = () => {
  const request = useRequest<IActivityItemPaymentResource[]>();

  const handler = (activityId: string, itemId: string, signal?: AbortSignal) =>
    request.handleRequest(() => listItemPaymentsRequest(activityId, itemId, signal));

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((payment) => payment.id !== id));

  return { payments: request.data ?? [], loading: request.loading, handler, onRemove };
};
