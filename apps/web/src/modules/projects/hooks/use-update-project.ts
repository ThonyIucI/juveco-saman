import type { IProjectInput, IProjectResource } from "@juveco/shared/projects";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { updateProjectRequest } from "@/modules/projects/services/project.service";

export const useUpdateProject = () => {
  const { loading, handleRequest } = useRequest<IProjectResource>();

  const handler = (id: string, payload: IProjectInput) =>
    handleRequest(async () => {
      const updated = await updateProjectRequest(id, payload);
      toast.success(`«${updated.name}» actualizado`);
      return updated;
    });

  return { loading, handler };
};
