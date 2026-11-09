import { Skeleton } from "@juveco/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { PartyPopper } from "lucide-react";
import { useEffect } from "react";

import EmptyState from "@/common/components/empty-state";
import { useListActivities } from "@/modules/activities/hooks/use-list-activities";

export const Route = createFileRoute("/_app/actividades/")({
  component: ActivitiesPage,
});

/**
 * Por ahora hay una sola actividad (acordado 2026-11-07): se entra directo a ella. Cuando se
 * sume otra, acá va el listado en cards y los links a cada una siguen sirviendo.
 */
function ActivitiesPage() {
  const ListActivities = useListActivities();
  const navigate = Route.useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    ListActivities.handler(controller.signal).then((activities) => {
      const [first] = activities ?? [];
      if (first) {
        navigate({ to: "/actividades/$activityId", params: { activityId: first.id }, replace: true });
      }
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasNoActivities = ListActivities.activities?.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <h1 className="font-heading text-xl font-bold text-foreground">Actividades</h1>
      {hasNoActivities ? (
        <EmptyState icon={PartyPopper} title="Todavía no hay actividades" />
      ) : (
        <Skeleton className="h-28 w-full rounded-2xl" />
      )}
    </div>
  );
}
