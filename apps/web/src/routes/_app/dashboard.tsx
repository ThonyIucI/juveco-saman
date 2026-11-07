import { userRoleLabels } from "@juveco/shared/roles";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

/** Por ahora solo saluda: lo demás se suma por partes. */
function DashboardPage() {
  const { user } = Route.useRouteContext();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Hola, {user.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{userRoleLabels[user.role]}</p>
      </div>

    </div>
  );
}
