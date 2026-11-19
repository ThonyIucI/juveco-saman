import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { parseUserRole } from "@juveco/shared/roles";

import { getCachedSession } from "@/lib/session-cache";

/**
 * Layout de todas las pantallas con sesión. Sin sesión → /login. La sesión sale de memoria
 * (`getCachedSession`): cambiar de vista no espera al servidor.
 */
export const Route = createFileRoute("/_app")({
  component: AppLayout,
  beforeLoad: async () => {
    const session = await getCachedSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    const role = parseUserRole(session.user.role);
    /* `user.id` es el del login; la persona (la que vende y cobra) es `userId`. */
    return { user: { ...session.user, role, personId: session.user.userId ?? "" } };
  },
});

function AppLayout() {
  return <Outlet />;
}
