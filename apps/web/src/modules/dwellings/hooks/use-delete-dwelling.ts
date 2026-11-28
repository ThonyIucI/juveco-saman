import type { IDwellingResource } from "@juveco/shared/dwellings";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteDwellingRequest } from "@/modules/dwellings/services/dwelling.service";

export const useDeleteDwelling = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (dwelling: IDwellingResource) =>
    handleRequest(async () => {
      const deleted = await deleteDwellingRequest(dwelling.id);
      toast.success(`Vivienda ${dwelling.code} eliminada`);
      return deleted;
    });

  return { loading, handler };
};
