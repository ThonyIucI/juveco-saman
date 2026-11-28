import { useRequest } from "@/common/hooks/use-request";
import { getNextDwellingCodeRequest } from "@/modules/dwellings/services/dwelling.service";

/** El código que le tocaría hoy a una vivienda nueva del barrio. */
export const useGetNextDwellingCode = () => {
  const { data, loading, handleRequest, setData } = useRequest<{ code: string }>();

  const handler = (neighborhoodId: string, signal?: AbortSignal) =>
    handleRequest(() => getNextDwellingCodeRequest(neighborhoodId, signal));

  const clear = () => setData(() => null);

  return { code: data?.code ?? null, loading, handler, clear };
};
