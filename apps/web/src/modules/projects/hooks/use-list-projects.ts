import type { IProjectResource } from "@juveco/shared/projects";

import { useRequest } from "@/common/hooks/use-request";
import { listProjectsRequest } from "@/modules/projects/services/project.service";

/** Los eventos y proyectos de Juveco. */
export const useListProjects = () => {
  const request = useRequest<IProjectResource[]>();

  const handler = (signal?: AbortSignal) => request.handleRequest(() => listProjectsRequest(signal));

  return { projects: request.data, loading: request.loading, handler };
};
