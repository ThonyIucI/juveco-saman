import { EActivityType } from "@juveco/shared/activities";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import DetailPage from "@/modules/public/components/detail-page";
import PrizeTable from "@/modules/public/components/prize-table";
import { useGetPublicHome } from "@/modules/public/hooks/use-get-public-home";
import { activityDatesOf, findActivityBySlug } from "@/modules/public/utils/activity-links";

/** Página pública de un bingo: `/bingos/ii-2026`. Premios, quién los donó y quién ganó. */
export const Route = createFileRoute("/bingos/$slug")({
  component: BingoPage,
});

function BingoPage() {
  const { slug } = Route.useParams();
  const GetPublicHome = useGetPublicHome();

  useEffect(() => {
    const controller = new AbortController();
    GetPublicHome.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const event = GetPublicHome.home?.project ?? null;
  const activity = event ? findActivityBySlug(event.activities, EActivityType.BINGO, slug) : null;

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
      <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Premios</h2>
      <PrizeTable prizes={activity?.prizes ?? []} />
    </DetailPage>
  );
}
