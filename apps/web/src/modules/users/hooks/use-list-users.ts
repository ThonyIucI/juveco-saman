import type { IUserResource } from "@juveco/shared/users";

import { useRequest } from "@/common/hooks/use-request";
import { listUsersRequest } from "@/modules/users/services/user.service";

/** Los usuarios. `onUpsert` y `onRemove` lo mantienen al día sin recargar. */
export const useListUsers = () => {
  const request = useRequest<IUserResource[]>();

  const handler = (signal?: AbortSignal) => request.handleRequest(() => listUsersRequest(signal));

  const onUpsert = (saved: IUserResource) =>
    request.setData((previous) => {
      const items = previous ?? [];
      return items.some((item) => item.id === saved.id)
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items];
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((item) => item.id !== id));

  return { users: request.data ?? [], loading: request.loading, handler, onUpsert, onRemove };
};
