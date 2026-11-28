import type { IPersonMatchResource } from "@juveco/shared/user-profiles";

import { useRequest } from "@/common/hooks/use-request";
import { type TPersonMatchQuery, findPersonMatchesRequest } from "@/modules/users/services/user.service";

/** Quién ya existe con ese DNI, o con esos nombres y fecha de nacimiento. */
export const useFindPersonMatches = () => {
  const { loading, handleRequest } = useRequest<IPersonMatchResource[]>();

  const handler = (query: TPersonMatchQuery, signal?: AbortSignal) =>
    handleRequest(() => findPersonMatchesRequest(query, signal));

  return { loading, handler };
};
