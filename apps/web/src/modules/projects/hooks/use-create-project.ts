import type { IProjectInput, IProjectResource } from "@juveco/shared/projects";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createProjectRequest } from "@/modules/projects/services/project.service";

export const useCreateProject = () => {
  const { loading, handleRequest } = useRequest<IProjectResource>();

  const handler = (payload: IProjectInput) =>
    handleRequest(async () => {
      const created = await createProjectRequest(payload);
      toast.success(`«${created.name}» creado`);
      return created;
    });

  return { loading, handler };
};
