import type { IActivityItemResource } from "@juveco/shared/activity-items";

import { useRequest } from "@/common/hooks/use-request";
import { listActivityItemsRequest } from "@/modules/activities/services/activity.service";

/** Lo vendido en una actividad. `onUpsert` y `onRemove` lo mantienen al día sin recargar. */
export const useListActivityItems = () => {
  const request = useRequest<IActivityItemResource[]>();

  const handler = (activityId: string, signal?: AbortSignal) =>
    request.handleRequest(() => listActivityItemsRequest(activityId, signal));

  const onUpsert = (saved: IActivityItemResource) =>
    request.setData((previous) => {
      const items = previous ?? [];
      return items.some((item) => item.id === saved.id)
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items];
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((item) => item.id !== id));

  return { items: request.data ?? [], loading: request.loading, handler, onUpsert, onRemove };
};
