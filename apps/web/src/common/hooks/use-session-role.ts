import { parseUserRole, type TUserRole } from "@juveco/shared/roles";

import { authClient } from "@/lib/auth-client";

/** Rol de quien entró (viene de su persona); `null` sin sesión. */
export const useSessionRole = (): TUserRole | null => {
  const { data: session } = authClient.useSession();
  return session ? parseUserRole(session.user.role) : null;
};
