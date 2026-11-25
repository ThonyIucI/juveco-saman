import type { IPublicHome } from "@juveco/shared/public";

import { useRequest } from "@/common/hooks/use-request";
import { getPublicHomeRequest } from "@/modules/public/services/public.service";

export const useGetPublicHome = () => {
  const request = useRequest<IPublicHome>();

  const handler = (signal?: AbortSignal) => request.handleRequest(() => getPublicHomeRequest(signal));

  return { home: request.data, loading: request.loading, handler };
};
