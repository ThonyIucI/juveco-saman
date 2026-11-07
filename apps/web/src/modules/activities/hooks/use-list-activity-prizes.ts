import type { IActivityPrizeResource } from "@juveco/shared/activity-prizes";

import { useRequest } from "@/common/hooks/use-request";
import { listActivityPrizesRequest } from "@/modules/activities/services/activity-finance.service";

/** `onUpsert` y `onRemove` mantienen la lista al día sin recargar. */
export const useListActivityPrizes = () => {
  const request = useRequest<IActivityPrizeResource[]>();

  const handler = (activityId: string, signal?: AbortSignal) =>
    request.handleRequest(() => listActivityPrizesRequest(activityId, signal));

  const onUpsert = (saved: IActivityPrizeResource) =>
    request.setData((previous) => {
      const list = previous ?? [];
      return list.some((entry) => entry.id === saved.id)
        ? list.map((entry) => (entry.id === saved.id ? saved : entry))
        : [...list, saved];
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((entry) => entry.id !== id));

  return { prizes: request.data ?? [], loading: request.loading, handler, onUpsert, onRemove };
};
