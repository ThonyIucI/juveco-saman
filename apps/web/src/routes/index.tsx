import { Skeleton } from "@juveco/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import Loadable from "@/common/components/loadable";
import AboutSection from "@/modules/public/components/about-section";
import EventPoster from "@/modules/public/components/event-poster";
import EventSection from "@/modules/public/components/event-section";
import FollowSection from "@/modules/public/components/follow-section";
import HeroCarousel from "@/modules/public/components/hero-carousel";
import LoadError from "@/modules/public/components/load-error";
import ProjectsSection from "@/modules/public/components/projects-section";
import SiteFooter from "@/modules/public/components/site-footer";
import SiteNavbar from "@/modules/public/components/site-navbar";
import UpcomingNotice from "@/modules/public/components/upcoming-notice";
import { useGetPublicHome } from "@/modules/public/hooks/use-get-public-home";
import { scrollToSection } from "@/modules/public/utils/scroll";

/**
 * Portada pública de Juveco Samán (boceto aprobado el 2026-11-25, ver
 * `docs/propuestas/portada/README.md`): una página web para los vecinos, no una pantalla del
 * panel. Secciones a todo el ancho que aparecen al hacer scroll: carrusel con el cartel del
 * evento encima, Nosotros, Proyectos, el evento en curso (sus actividades y las cuentas claras;
 * el detalle del campeonato y del bingo vive en su página) y las redes. Un aviso flotante
 * anuncia lo próximo. Se ve sin sesión.
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
  const isLoading = !isReady && !GetPublicHome.hasFailed;
  const event = GetPublicHome.home?.project ?? null;
  /* Cargando o con error, la sección del evento existe; solo se oculta si ya cargó y no hay evento. */
  const hasEvent = !isReady || event !== null;
  const hasScrolledToHashRef = useRef(false);

  /* El router busca `#evento` antes de que lleguen los datos: al estar listo, se baja una vez. */
  useEffect(() => {
    const hash = window.location.hash;
    if (!isReady || !hash || hasScrolledToHashRef.current) {
      return;
    }
    hasScrolledToHashRef.current = true;
    scrollToSection(hash.slice(1));
  }, [isReady]);

  return (
    <div className="min-h-svh bg-background">
      <SiteNavbar isHome isContentReady={isReady} hasEvent={hasEvent} />
      <main>
        <HeroCarousel hasEvent={hasEvent} />
        {/* Sin evento o con error no queda hueco: el margen negativo solo existe si hay cartel. */}
        {(isLoading || event) && (
          <div className="relative z-10 mx-auto -mt-14 max-w-6xl px-4 md:-mt-16 md:px-6">
            <Loadable isLoading={isLoading} skeleton={<EventPosterSkeleton />}>
              {event && <EventPoster event={event} />}
            </Loadable>
          </div>
        )}
        <AboutSection />
        <ProjectsSection />
        {/* Contenedor fijo: el ancla existe desde el primer render, haya o no datos. */}
        <div id="evento" className="scroll-mt-16">
          {GetPublicHome.hasFailed ? (
            <div className="border-t border-border">
              <LoadError onRetry={GetPublicHome.retry} />
            </div>
          ) : (
            <Loadable isLoading={isLoading} skeleton={<EventSkeleton />}>
              {event && <EventSection event={event} />}
            </Loadable>
          )}
        </div>
        <FollowSection />
      </main>
      {event && <UpcomingNotice event={event} />}
      <SiteFooter hasEvent={hasEvent} />
    </div>
  );
}

/* Con la forma de la sección del evento, sobre su azul marino: título y dos piezas. */
function EventSkeleton() {
  return (
    <div className="border-t border-white/10 bg-[#14214A]">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-14 md:px-6 md:py-20">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-md bg-white/15" />
          <Skeleton className="h-8 w-64 rounded-md bg-white/15" />
          <Skeleton className="h-5 w-96 max-w-full rounded-md bg-white/15" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-xl bg-white/15" />
          <Skeleton className="h-32 rounded-xl bg-white/15" />
        </div>
        <Skeleton className="h-24 rounded-lg bg-white/15" />
      </div>
    </div>
  );
}

/* Con la forma del cartel: una tarjeta, más alta en celular donde va en dos filas. */
function EventPosterSkeleton() {
  return <Skeleton className="h-52 w-full rounded-xl md:h-40" />;
}
