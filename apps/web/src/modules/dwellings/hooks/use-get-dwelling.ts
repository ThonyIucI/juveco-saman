import type { IDwellingDetailResource } from "@juveco/shared/dwellings";

import { useRequest } from "@/common/hooks/use-request";
import { getDwellingRequest } from "@/modules/dwellings/services/dwelling.service";

/** Una vivienda con sus familias. `onReplace` recibe lo que responde cada escritura. */
export const useGetDwelling = () => {
  const request = useRequest<IDwellingDetailResource>();

  const handler = (dwellingId: string, signal?: AbortSignal) =>
    request.handleRequest(() => getDwellingRequest(dwellingId, signal));

  const onReplace = (dwelling: IDwellingDetailResource) => request.setData(() => dwelling);

  return { dwelling: request.data, loading: request.loading, handler, onReplace };
};
