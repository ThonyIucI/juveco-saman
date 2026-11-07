import type { IActivityExpenseResource } from "@juveco/shared/activity-expenses";

import { useRequest } from "@/common/hooks/use-request";
import { listActivityExpensesRequest } from "@/modules/activities/services/activity-finance.service";

/** `onUpsert` y `onRemove` mantienen la lista al día sin recargar. */
export const useListActivityExpenses = () => {
  const request = useRequest<IActivityExpenseResource[]>();

  const handler = (activityId: string, signal?: AbortSignal) =>
    request.handleRequest(() => listActivityExpensesRequest(activityId, signal));

  const onUpsert = (saved: IActivityExpenseResource) =>
    request.setData((previous) => {
      const list = previous ?? [];
      return list.some((entry) => entry.id === saved.id)
        ? list.map((entry) => (entry.id === saved.id ? saved : entry))
        : [...list, saved];
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((entry) => entry.id !== id));

  return { expenses: request.data ?? [], loading: request.loading, handler, onUpsert, onRemove };
};
