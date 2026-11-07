import { type IPersonInput, fullName } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createUserRequest } from "@/modules/users/services/user.service";

export const useCreateUser = () => {
  const { loading, handleRequest } = useRequest<IUserResource>();

  const handler = (payload: IPersonInput) =>
    handleRequest(async () => {
      const created = await createUserRequest(payload);
      toast.success(`Usuario «${fullName(created)}» agregado`);
      return created;
    });

  return { loading, handler };
};
