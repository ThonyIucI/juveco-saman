import type { IUserResource } from "@juveco/shared/users";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type TUpdateUserPayload,
  updateUserRequest,
} from "@/modules/users/services/user.service";

export const useUpdateUser = () => {
  const { loading, handleRequest } = useRequest<IUserResource>();

  const handler = (id: string, payload: TUpdateUserPayload) =>
    handleRequest(async () => {
      const saved = await updateUserRequest(id, payload);
      toast.success("Cambios guardados");
      return saved;
    });

  return { loading, handler };
};
