import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import type { IFamilyResource } from "@juveco/shared/families";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteFamilyRequest } from "@/modules/dwellings/services/dwelling.service";

/** Elimina la familia y sus integrantes de la lista; las personas siguen como usuarios. */
export const useDeleteFamily = () => {
  const { loading, handleRequest } = useRequest<IDwellingDetailResource>();

  const handler = (family: IFamilyResource) =>
    handleRequest(async () => {
      const saved = await deleteFamilyRequest(family.dwellingId, family.id);
      toast.success("Familia eliminada");
      return saved;
    });

  return { loading, handler };
};
