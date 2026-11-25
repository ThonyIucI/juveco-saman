import { EActivityType } from "@juveco/shared/activities";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import ChampionshipBoard from "@/modules/public/components/championship-board";
import DetailPage from "@/modules/public/components/detail-page";
import { useGetPublicHome } from "@/modules/public/hooks/use-get-public-home";
import { activityDatesOf, findActivityBySlug, hasPublishedResults } from "@/modules/public/utils/activity-links";

/** Página pública de un campeonato: `/campeonatos/relampago-2026`. Resultados y goleadores. */
export const Route = createFileRoute("/campeonatos/$slug")({
  component: ChampionshipPage,
});

function ChampionshipPage() {
  const { slug } = Route.useParams();
  const GetPublicHome = useGetPublicHome();

  useEffect(() => {
    const controller = new AbortController();
    GetPublicHome.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const event = GetPublicHome.home?.project ?? null;
  const activity = event ? findActivityBySlug(event.activities, EActivityType.CHAMPIONSHIP, slug) : null;

  return (
    <DetailPage
      isLoading={GetPublicHome.home === null && !GetPublicHome.hasFailed}
      hasFailed={GetPublicHome.hasFailed}
      onRetry={GetPublicHome.retry}
      header={
        event && activity
          ? { title: activity.name, subtitle: activityDatesOf(activity), eventName: event.name }
          : null
      }
    >
      {activity && hasPublishedResults(activity) ? (
        <ChampionshipBoard />
      ) : (
        <p className="text-base text-muted-foreground">Aún no hay resultados publicados.</p>
      )}
    </DetailPage>
  );
}
