import type { IDwellingResource } from "@juveco/shared/dwellings";

import { useRequest } from "@/common/hooks/use-request";
import { listDwellingsRequest } from "@/modules/dwellings/services/dwelling.service";

/** Las viviendas. `onUpsert` y `onRemove` las mantienen al día sin recargar. */
export const useListDwellings = () => {
  const request = useRequest<IDwellingResource[]>();

  const handler = (signal?: AbortSignal) => request.handleRequest(() => listDwellingsRequest(signal));

  const onUpsert = (saved: IDwellingResource) =>
    request.setData((previous) => {
      const items = previous ?? [];
      return items.some((item) => item.id === saved.id)
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items];
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((item) => item.id !== id));

  return { dwellings: request.data ?? [], loading: request.loading, handler, onUpsert, onRemove };
};
