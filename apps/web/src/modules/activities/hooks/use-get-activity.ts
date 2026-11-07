import type { IActivityResource } from "@juveco/shared/activities";

import { useRequest } from "@/common/hooks/use-request";
import { getActivityRequest } from "@/modules/activities/services/activity.service";

/** Una actividad: su nombre, fecha y precio por defecto. */
export const useGetActivity = () => {
  const request = useRequest<IActivityResource>();

  const handler = (id: string, signal?: AbortSignal) =>
    request.handleRequest(() => getActivityRequest(id, signal));

  return { activity: request.data, loading: request.loading, handler };
};
