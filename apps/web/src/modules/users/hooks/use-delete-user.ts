import { fullName } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteUserRequest } from "@/modules/users/services/user.service";

export const useDeleteUser = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (user: IUserResource) =>
    handleRequest(async () => {
      const deleted = await deleteUserRequest(user.id);
      toast.success(`«${fullName(user)}» eliminado`);
      return deleted;
    });

  return { loading, handler };
};
