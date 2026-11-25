import { Skeleton } from "@juveco/ui/components/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import Loadable from "@/common/components/loadable";

import LoadError from "./load-error";
import SiteFooter from "./site-footer";
import SiteNavbar from "./site-navbar";

interface IDetailPageProps {
  isLoading: boolean;
  /** La API no respondió: se muestra el error con «Reintentar» en lugar del esqueleto. */
  hasFailed: boolean;
  onRetry: () => void;
  /** `null` ya cargado: la actividad no existe. */
  header: { title: string; subtitle: string; eventName: string } | null;
  children: ReactNode;
}

/**
 * Página de detalle de una actividad (campeonato, bingo): el mismo navbar y footer del inicio,
 * un «volver» al evento, el título y el contenido en el contenedor común.
 */
export default function DetailPage({ isLoading, hasFailed, onRetry, header, children }: IDetailPageProps) {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-background">
      <SiteNavbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-12">
        {hasFailed ? (
          <LoadError onRetry={onRetry} />
        ) : (
          <Loadable
            isLoading={isLoading}
            skeleton={
              <div className="space-y-4">
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-8 w-72 rounded-md" />
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            }
          >
            {header ? (
              <>
                <Link
                  to="/"
                  hash="evento"
                  className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  <ArrowLeft className="size-4" />
                  {header.eventName}
                </Link>
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{header.title}</h1>
                <p className="mt-1 mb-6 text-base md:mb-8 text-muted-foreground">{header.subtitle}</p>
                {children}
              </>
            ) : (
              <div className="py-16 text-center">
                <p className="text-base text-foreground">No encontramos esta actividad.</p>
                <Link to="/" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
                  Volver al inicio
                </Link>
              </div>
            )}
          </Loadable>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
