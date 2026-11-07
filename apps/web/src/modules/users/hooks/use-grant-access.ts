import { fullName } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { type IGrantAccessPayload, grantAccessRequest } from "@/modules/users/services/user.service";

export const useGrantAccess = () => {
  const { loading, handleRequest } = useRequest<IUserResource>();

  const handler = (id: string, payload: IGrantAccessPayload) =>
    handleRequest(async () => {
      const updated = await grantAccessRequest(id, payload);
      toast.success(`«${fullName(updated)}» ya puede entrar`);
      return updated;
    });

  return { loading, handler };
};
