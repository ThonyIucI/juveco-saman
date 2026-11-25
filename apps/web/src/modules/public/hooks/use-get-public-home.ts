import type { IPublicHome } from "@juveco/shared/public";
import { useState } from "react";

import { useRequest } from "@/common/hooks/use-request";
import { getPublicHomeRequest } from "@/modules/public/services/public.service";

export const useGetPublicHome = () => {
  const request = useRequest<IPublicHome>();
  const [hasFailed, setHasFailed] = useState(false);

  const handler = async (signal?: AbortSignal) => {
    setHasFailed(false);
    const result = await request.handleRequest(() => getPublicHomeRequest(signal));
    /* Sin datos y sin abort: la petición falló (el toast ya salió). */
    if (result === null && !signal?.aborted) {
      setHasFailed(true);
    }
    return result;
  };

  const retry = () => handler();

  return { home: request.data, hasFailed, handler, retry };
};
