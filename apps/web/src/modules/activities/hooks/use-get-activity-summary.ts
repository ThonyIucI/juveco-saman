import type { IActivitySummary } from "@juveco/shared/activity-item-payments";

import { useRequest } from "@/common/hooks/use-request";
import { getActivitySummaryRequest } from "@/modules/activities/services/activity.service";

/** Los KPIs de una actividad. */
export const useGetActivitySummary = () => {
  const request = useRequest<IActivitySummary>();

  const handler = (activityId: string, signal?: AbortSignal) =>
    request.handleRequest(() => getActivitySummaryRequest(activityId, signal));

  return { summary: request.data, loading: request.loading, handler };
};
