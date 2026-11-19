import type { IProjectDetail } from "@juveco/shared/projects";

import { useRequest } from "@/common/hooks/use-request";
import { getProjectRequest } from "@/modules/projects/services/project.service";

/** Un proyecto con lo ganado y sus actividades. */
export const useGetProject = () => {
  const request = useRequest<IProjectDetail>();

  const handler = (id: string, signal?: AbortSignal) => request.handleRequest(() => getProjectRequest(id, signal));

  return { detail: request.data, loading: request.loading, handler };
};
