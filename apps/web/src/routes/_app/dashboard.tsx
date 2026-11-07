import { Skeleton } from "@juveco/ui/components/skeleton";
import { EUserRole, userRoleLabels } from "@juveco/shared/roles";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PartyPopper, UsersRound } from "lucide-react";
import { useEffect } from "react";

import EmptyState from "@/common/components/empty-state";
import ActivityOverviewCard from "@/modules/activities/components/activity-overview-card";
import { useListActivities } from "@/modules/activities/hooks/use-list-activities";
import { useListUsers } from "@/modules/users/hooks/use-list-users";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const SKELETON_CARDS = 2;

/* El equipo son quienes entran a la app (acordado 2026-11-07). */
const TEAM_ROLES = new Set<string>([EUserRole.ADMIN, EUserRole.SUPERADMIN]);

/**
 * Inicio: el saludo, cuántos son en el equipo (los administradores) y las actividades, cada
 * una con su ganancia neta si ya se realizó o la fecha en que se hará.
 */
function DashboardPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const ListActivities = useListActivities();
  const ListUsers = useListUsers();

  useEffect(() => {
    const controller = new AbortController();
    ListActivities.handler(controller.signal);
    ListUsers.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { activities } = ListActivities;
  const isLoadingActivities = ListActivities.loading && activities.length === 0;
  const isLoadingTeam = ListUsers.loading && ListUsers.users.length === 0;
  const teamCount = ListUsers.users.filter((person) => TEAM_ROLES.has(person.role)).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Hola, {user.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{userRoleLabels[user.role]}</p>
      </div>

      <section aria-labelledby="team-title">
        <div className="flex items-center gap-3 rounded-sm border border-border bg-card p-3 sm:max-w-xs">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <UsersRound aria-hidden className="size-5" />
          </span>
          <div className="min-w-0">
            <p id="team-title" className="text-sm font-medium text-muted-foreground">
              Equipo
            </p>
            {isLoadingTeam ? (
              <Skeleton className="mt-1 h-6 w-32 rounded-md" />
            ) : (
              <p className="font-heading text-lg font-bold text-foreground">
                {teamCount === 1 ? "1 administrador" : `${teamCount} administradores`}
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="activities-title" className="space-y-3">
        <h2 id="activities-title" className="font-heading text-lg font-bold text-foreground">
          Actividades
        </h2>

        {isLoadingActivities ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <Skeleton key={index} className="h-28 rounded-sm" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState icon={PartyPopper} title="Todavía no hay actividades" />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <li key={activity.id}>
                <ActivityOverviewCard
                  activity={activity}
                  onOpen={() => navigate({ to: "/actividades/$activityId", params: { activityId: activity.id } })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
