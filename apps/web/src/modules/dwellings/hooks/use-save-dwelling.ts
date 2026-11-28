import type { IDwellingCreateInput, IDwellingDetailResource, IDwellingInput } from "@juveco/shared/dwellings";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createDwellingRequest, updateDwellingRequest } from "@/modules/dwellings/services/dwelling.service";

/** Crea una vivienda, o edita una que ya existe. Los dos devuelven la vivienda completa. */
export const useSaveDwelling = () => {
  const { loading, handleRequest } = useRequest<IDwellingDetailResource>();

  const create = (payload: IDwellingCreateInput) =>
    handleRequest(async () => {
      const saved = await createDwellingRequest(payload);
      toast.success(`Vivienda ${saved.code} registrada`);
      return saved;
    });

  const update = (dwellingId: string, payload: IDwellingInput) =>
    handleRequest(async () => {
      const saved = await updateDwellingRequest(dwellingId, payload);
      toast.success(`Vivienda ${saved.code} actualizada`);
      return saved;
    });

  return { loading, create, update };
};
