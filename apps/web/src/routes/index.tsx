import { Skeleton } from "@juveco/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import Loadable from "@/common/components/loadable";
import AboutSection from "@/modules/public/components/about-section";
import AccountsSection from "@/modules/public/components/accounts-section";
import EventSection from "@/modules/public/components/event-section";
import FollowSection from "@/modules/public/components/follow-section";
import HeroCarousel from "@/modules/public/components/hero-carousel";
import NowStrip from "@/modules/public/components/now-strip";
import ProjectsSection from "@/modules/public/components/projects-section";
import SiteFooter from "@/modules/public/components/site-footer";
import SiteNavbar from "@/modules/public/components/site-navbar";
import { useGetPublicHome } from "@/modules/public/hooks/use-get-public-home";

/**
 * Portada pública de Juveco Samán (boceto aprobado el 2026-11-25, ver
 * `docs/propuestas/portada/README.md`): una página web para los vecinos, no una pantalla del
 * panel. Secciones a todo el ancho que aparecen al hacer scroll: carrusel, «Ahora», Nosotros,
 * Proyectos, el evento en curso, sus cuentas claras y las redes. Se ve sin sesión.
 */
export const Route = createFileRoute("/")({
  component: PublicHomePage,
});

function PublicHomePage() {
  const GetPublicHome = useGetPublicHome();

  useEffect(() => {
    const controller = new AbortController();
    GetPublicHome.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isReady = GetPublicHome.home !== null;
  const event = GetPublicHome.home?.project ?? null;

  return (
    <div className="min-h-svh bg-background">
      <SiteNavbar isContentReady={isReady} />
      <main>
        <HeroCarousel />
        {event && <NowStrip event={event} />}
        <AboutSection />
        <ProjectsSection />
        <Loadable isLoading={!isReady} skeleton={<EventSkeleton />}>
          {event && (
            <>
              <EventSection event={event} />
              <AccountsSection event={event} />
            </>
          )}
        </Loadable>
        <FollowSection />
      </main>
      <SiteFooter />
    </div>
  );
}

/* Con la forma de la sección del evento: título, cifras y la línea de tiempo. */
function EventSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-16 md:px-6 md:py-24">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-10 w-72 rounded-md" />
        <Skeleton className="h-5 w-96 max-w-full rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
