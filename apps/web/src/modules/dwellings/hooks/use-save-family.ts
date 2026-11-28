import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import type { IFamilyCreateInput, IFamilyResource, IFamilyUpdateInput } from "@juveco/shared/families";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createFamilyRequest, updateFamilyRequest } from "@/modules/dwellings/services/dwelling.service";

/** Crea una familia con su jefe, o edita el contacto y la nota de una que ya existe. */
export const useSaveFamily = () => {
  const { loading, handleRequest } = useRequest<IDwellingDetailResource>();

  const create = (dwellingId: string, payload: IFamilyCreateInput) =>
    handleRequest(async () => {
      const saved = await createFamilyRequest(dwellingId, payload);
      toast.success("Familia agregada");
      return saved;
    });

  const update = (family: IFamilyResource, payload: IFamilyUpdateInput) =>
    handleRequest(async () => {
      const saved = await updateFamilyRequest(family.dwellingId, family.id, payload);
      toast.success("Familia actualizada");
      return saved;
    });

  return { loading, create, update };
};
