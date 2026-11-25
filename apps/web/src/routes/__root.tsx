import { Toaster } from "@juveco/ui/components/sonner";
import { cn } from "@juveco/ui/lib/utils";
import { HeadContent, Outlet, createRootRouteWithContext, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { isChromelessPath } from "@/common/constants/routes";
import { useHasSidebar, useNavItems } from "@/common/hooks/use-nav-items";
import AppSidebar from "@/components/app-sidebar";
import BottomNav from "@/components/bottom-nav";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Juveco Samán",
      },
      {
        name: "description",
        content: "Junta Vecinal Comunal Samán.",
      },
    ],
  }),
});

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  /* Las rutas públicas y el login traen su propio encabezado: sin menús de la app aunque haya sesión. */
  const isChromeless = isChromelessPath(pathname);
  /* El hueco para la barra inferior solo se reserva cuando la barra existe (hay sesión). */
  const hasBottomNav = useNavItems().length > 0 && !isChromeless;
  /* Con sesión, todos tienen menú lateral. */
  const hasSidebar = useHasSidebar() && !isChromeless;

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
        storageKey="vite-ui-theme"
      >
        <>
          {/* En escritorio el menú lateral va `fixed`: el resto se corre su ancho. */}
          <div className={cn("grid min-h-svh grid-rows-[auto_1fr]", hasSidebar && "md:pl-64")}>
            <Header />
            {/*
              En escritorio, con sesión, el fondo es gris suave y las cajas de cada página van en
              blanco encima, sin borde, como id-pos (Thony, 2026-11-09).
            */}
            <div className={cn("min-w-0", hasBottomNav && "pb-20 sm:pb-0", hasSidebar && "md:bg-page")}>
              <Outlet />
            </div>
          </div>

          {hasSidebar && <AppSidebar />}

          {/*
            La barra inferior va `fixed`, por eso no es una fila de la grilla y el contenido
            lleva `pb-20` para no quedar debajo (solo con sesión).
          */}
          {!isChromeless && <BottomNav />}
        </>
        <Toaster richColors />
      </ThemeProvider>
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-left" />}
    </>
  );
}
