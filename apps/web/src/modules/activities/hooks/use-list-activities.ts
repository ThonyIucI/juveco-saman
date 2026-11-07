import type { IActivityResource } from "@juveco/shared/activities";

import { useRequest } from "@/common/hooks/use-request";
import { listActivitiesRequest } from "@/modules/activities/services/activity.service";

/** Las actividades de Juveco. */
export const useListActivities = () => {
  const request = useRequest<IActivityResource[]>();

  const handler = (signal?: AbortSignal) => request.handleRequest(() => listActivitiesRequest(signal));

  return { activities: request.data, loading: request.loading, handler };
};
