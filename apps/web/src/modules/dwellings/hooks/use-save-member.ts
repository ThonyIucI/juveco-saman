import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import type { IFamilyMemberSaveInput, IFamilyMemberUpdateInput } from "@juveco/shared/families";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createMemberRequest, updateMemberRequest } from "@/modules/dwellings/services/dwelling.service";

/** Agrega o edita a un integrante de la vivienda: su persona, su parentesco y su jefatura. */
export const useSaveMember = () => {
  const { loading, handleRequest } = useRequest<IDwellingDetailResource>();

  const create = (dwellingId: string, payload: IFamilyMemberSaveInput, personName: string) =>
    handleRequest(async () => {
      const saved = await createMemberRequest(dwellingId, payload);
      toast.success(`«${personName}» agregado`);
      return saved;
    });

  const update = (dwellingId: string, memberId: string, payload: IFamilyMemberUpdateInput, personName: string) =>
    handleRequest(async () => {
      const saved = await updateMemberRequest(dwellingId, memberId, payload);
      toast.success(`«${personName}» actualizado`);
      return saved;
    });

  return { loading, create, update };
};
