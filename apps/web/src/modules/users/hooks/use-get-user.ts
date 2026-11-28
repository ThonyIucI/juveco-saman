import type { IUserDetailResource } from "@juveco/shared/users";

import { useRequest } from "@/common/hooks/use-request";
import { getUserRequest } from "@/modules/users/services/user.service";

/** Una persona con los datos del censo. */
export const useGetUser = () => {
  const { loading, handleRequest } = useRequest<IUserDetailResource>();

  const handler = (id: string, signal?: AbortSignal) => handleRequest(() => getUserRequest(id, signal));

  return { loading, handler };
};
