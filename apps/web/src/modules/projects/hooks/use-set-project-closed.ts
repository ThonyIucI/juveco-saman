import type { IProjectResource } from "@juveco/shared/projects";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { closeProjectRequest, reopenProjectRequest } from "@/modules/projects/services/project.service";

/** Cerrar (cualquier admin) o reabrir (solo el superadmin) un proyecto. */
export const useSetProjectClosed = () => {
  const { loading, handleRequest } = useRequest<IProjectResource>();

  const close = (id: string) =>
    handleRequest(async () => {
      const closed = await closeProjectRequest(id);
      toast.success(`«${closed.name}» cerrado`);
      return closed;
    });

  const reopen = (id: string) =>
    handleRequest(async () => {
      const reopened = await reopenProjectRequest(id);
      toast.success(`«${reopened.name}» reabierto`);
      return reopened;
    });

  return { loading, close, reopen };
};
