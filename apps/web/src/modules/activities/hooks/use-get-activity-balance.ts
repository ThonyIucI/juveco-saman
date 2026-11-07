import type { IActivityBalance } from "@juveco/shared/activity-expenses";

import { useRequest } from "@/common/hooks/use-request";
import { getActivityBalanceRequest } from "@/modules/activities/services/activity-finance.service";

/** El balance de una actividad: ingresos menos premios comprados y gastos. */
export const useGetActivityBalance = () => {
  const request = useRequest<IActivityBalance>();

  const handler = (activityId: string, signal?: AbortSignal) =>
    request.handleRequest(() => getActivityBalanceRequest(activityId, signal));

  return { balance: request.data, loading: request.loading, handler };
};
