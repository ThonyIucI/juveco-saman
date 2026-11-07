import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { parseUserRole } from "@juveco/shared/roles";

import { authClient } from "@/lib/auth-client";

/** Layout de todas las pantallas con sesión. Sin sesión → /login. */
export const Route = createFileRoute("/_app")({
  component: AppLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();

    if (!session.data) {
      throw redirect({ to: "/login" });
    }

    const role = parseUserRole(session.data.user.role);
    return { user: { ...session.data.user, role } };
  },
});

function AppLayout() {
  return <Outlet />;
}
