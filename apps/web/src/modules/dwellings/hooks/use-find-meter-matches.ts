import type { IMeterMatchResource } from "@juveco/shared/dwellings";

import { useRequest } from "@/common/hooks/use-request";
import { findMeterMatchesRequest } from "@/modules/dwellings/services/dwelling.service";

/** Otras viviendas con el mismo medidor: solo avisa, no bloquea. */
export const useFindMeterMatches = () => {
  const { data, loading, handleRequest, setData } = useRequest<IMeterMatchResource[]>();

  const handler = (meterNumber: string, exceptId?: string, signal?: AbortSignal) =>
    handleRequest(() => findMeterMatchesRequest(meterNumber, exceptId, signal));

  const clear = () => setData(() => null);

  return { matches: data ?? [], loading, handler, clear };
};
