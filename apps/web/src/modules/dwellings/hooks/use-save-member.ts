import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import type { IFamilyMemberInput, IFamilyMemberResource, IFamilyResource } from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createMemberRequest, updateMemberRequest } from "@/modules/dwellings/services/dwelling.service";

type TRelationshipChange = Pick<IFamilyMemberInput, "relationship">;

/** Agrega un integrante a una familia, o cambia el parentesco del que se pasa. */
export const useSaveMember = () => {
  const { loading, handleRequest } = useRequest<IDwellingDetailResource>();

  const create = (family: IFamilyResource, payload: IFamilyMemberInput, personName: string) =>
    handleRequest(async () => {
      const saved = await createMemberRequest(family.dwellingId, family.id, payload);
      toast.success(`«${personName}» agregado`);
      return saved;
    });

  const update = (family: IFamilyResource, member: IFamilyMemberResource, payload: TRelationshipChange) =>
    handleRequest(async () => {
      const saved = await updateMemberRequest(family.dwellingId, family.id, member.id, payload);
      toast.success(`«${fullName(member)}» actualizado`);
      return saved;
    });

  return { loading, create, update };
};
