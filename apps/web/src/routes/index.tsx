import { Skeleton } from "@juveco/ui/components/skeleton";
import { EActivityType } from "@juveco/shared/activities";
import type { IPublicActivity, IPublicProject } from "@juveco/shared/public";
import { createFileRoute } from "@tanstack/react-router";
import { PartyPopper, Scale, Share2, Ticket, Trophy } from "lucide-react";
import { useEffect } from "react";

import Loadable from "@/common/components/loadable";
import { formatLongDate } from "@/common/utils/format-date";
import BalanceConcepts from "@/modules/public/components/balance-concepts";
import ChampionshipResults from "@/modules/public/components/championship-results";
import PrizeBoard from "@/modules/public/components/prize-board";
import PublicHeader from "@/modules/public/components/public-header";
import PublicSection from "@/modules/public/components/public-section";
import SocialFeeds from "@/modules/public/components/social-feeds";
import SocialLinks from "@/modules/public/components/social-links";
import { MATCH_DAYS } from "@/modules/public/data/relampago-2026";
import { useGetPublicHome } from "@/modules/public/hooks/use-get-public-home";

/**
 * Portada pública (acordado 2026-11-25): quiénes somos, el evento en curso con sus
 * actividades (premios del bingo, resultados del campeonato), su balance sin montos y las
 * redes. Se ve sin sesión; los administradores entran desde «Ingresar».
 */
export const Route = createFileRoute("/")({
  component: PublicHomePage,
});

const SKELETON_SECTIONS = 3;

function PublicHomePage() {
  const GetPublicHome = useGetPublicHome();

  useEffect(() => {
    const controller = new AbortController();
    GetPublicHome.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const project = GetPublicHome.home?.project ?? null;

  return (
    <div className="min-h-svh bg-page">
      <PublicHeader />

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <section className="space-y-3 py-2">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Junta Vecinal Comunal Samán
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Vecinos que nos organizamos para sacar adelante actividades y proyectos para nuestro barrio.
          </p>
          <SocialLinks />
        </section>

        <Loadable isLoading={!GetPublicHome.home} skeleton={<PublicHomeSkeleton />} className="space-y-4">
          {project && <ProjectSections project={project} />}
        </Loadable>

        <PublicSection icon={Share2} title="Síguenos" subtitle="Lo último en nuestras redes.">
          <SocialFeeds />
        </PublicSection>
      </main>

      <footer className="pb-8 text-center text-xs font-medium tracking-wide text-muted-foreground">
        Juveco Samán · Gestión 2026 – 2028
      </footer>
    </div>
  );
}

function ProjectSections({ project }: { project: IPublicProject }) {
  const facts = [
    formatLongDate(project.startDate),
    project.beneficiaryCount ? `${project.beneficiaryCount} beneficiarios` : null,
  ].filter(Boolean);

  return (
    <>
      <PublicSection icon={PartyPopper} title={project.name} subtitle={facts.join(" · ")}>
        {project.description && <p className="mb-3 text-foreground">{project.description}</p>}
        <ul className="space-y-1.5">
          {project.activities.map((activity) => (
            <li key={activity.id}>
              <a href={`#${activity.id}`} className="font-semibold text-primary hover:underline">
                {activity.name}
              </a>
              <span className="text-muted-foreground"> · {activityDates(activity)}</span>
            </li>
          ))}
        </ul>
      </PublicSection>

      {project.activities.map((activity) => (
        <ActivitySection key={activity.id} activity={activity} />
      ))}

      <PublicSection
        icon={Scale}
        title={`Balance de ${project.name}`}
        subtitle="De dónde vinieron los fondos y en qué se usaron."
      >
        <BalanceConcepts activities={project.activities} supporters={project.supporters} />
      </PublicSection>
    </>
  );
}

/* El campeonato se juega en dos fechas: salen de sus resultados, no de la actividad. */
const activityDates = (activity: IPublicActivity): string =>
  activity.type === EActivityType.CHAMPIONSHIP
    ? MATCH_DAYS.map((day) => formatLongDate(day.date)).join(" y ")
    : formatLongDate(activity.eventDate);

function ActivitySection({ activity }: { activity: IPublicActivity }) {
  if (activity.type === EActivityType.CHAMPIONSHIP) {
    return (
      <PublicSection id={activity.id} icon={Trophy} title={activity.name} subtitle={activityDates(activity)}>
        <ChampionshipResults />
      </PublicSection>
    );
  }
  return (
    <PublicSection id={activity.id} icon={Ticket} title={activity.name} subtitle={activityDates(activity)}>
      <PrizeBoard prizes={activity.prizes} />
    </PublicSection>
  );
}

/* Con la forma de las cards que vienen: encabezado gris y unas líneas. */
function PublicHomeSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: SKELETON_SECTIONS }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border bg-muted/50 px-4 py-3">
            <Skeleton className="h-6 w-48 rounded-md" />
          </div>
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-3/4 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
