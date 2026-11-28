import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import type { IFamilyMemberResource } from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteMemberRequest } from "@/modules/dwellings/services/dwelling.service";

/** Saca a un integrante de la vivienda; la persona sigue como usuario. */
export const useDeleteMember = () => {
  const { loading, handleRequest } = useRequest<IDwellingDetailResource>();

  const handler = (dwellingId: string, member: IFamilyMemberResource) =>
    handleRequest(async () => {
      const saved = await deleteMemberRequest(dwellingId, member.id);
      toast.success(`«${fullName(member)}» quitado de la vivienda`);
      return saved;
    });

  return { loading, handler };
};
