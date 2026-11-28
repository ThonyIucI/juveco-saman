import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import type { IFamilyMemberResource, IFamilyResource } from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteMemberRequest } from "@/modules/dwellings/services/dwelling.service";

/** Saca a un integrante de su familia; la persona sigue como usuario. */
export const useDeleteMember = () => {
  const { loading, handleRequest } = useRequest<IDwellingDetailResource>();

  const handler = (family: IFamilyResource, member: IFamilyMemberResource) =>
    handleRequest(async () => {
      const saved = await deleteMemberRequest(family.dwellingId, family.id, member.id);
      toast.success(`«${fullName(member)}» quitado de la familia`);
      return saved;
    });

  return { loading, handler };
};
