import type { IActivityExpenseResource } from "@juveco/shared/activity-expenses";

import { useRequest } from "@/common/hooks/use-request";
import { listActivityMovementsRequest } from "@/modules/activities/services/activity-finance.service";
import type { TMovementKind } from "@/modules/activities/utils/movements";

/** Los ingresos o los gastos de una actividad. `onUpsert` y `onRemove` la mantienen al día. */
export const useListActivityMovements = (kind: TMovementKind) => {
  const request = useRequest<IActivityExpenseResource[]>();

  const handler = (activityId: string, signal?: AbortSignal) =>
    request.handleRequest(() => listActivityMovementsRequest(kind, activityId, signal));

  const onUpsert = (saved: IActivityExpenseResource) =>
    request.setData((previous) => {
      const list = previous ?? [];
      return list.some((entry) => entry.id === saved.id)
        ? list.map((entry) => (entry.id === saved.id ? saved : entry))
        : [...list, saved];
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((entry) => entry.id !== id));

  return { movements: request.data ?? [], loading: request.loading, handler, onUpsert, onRemove };
};
