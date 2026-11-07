import { Toaster } from "@juveco/ui/components/sonner";
import { cn } from "@juveco/ui/lib/utils";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

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
  /* El hueco para la barra inferior solo se reserva cuando la barra existe (hay sesión). */
  const hasBottomNav = useNavItems().length > 0;
  /* Con sesión, todos tienen menú lateral. */
  const hasSidebar = useHasSidebar();

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
            <div className={cn("min-w-0", hasBottomNav && "pb-20 sm:pb-0")}>
              <Outlet />
            </div>
          </div>

          {hasSidebar && <AppSidebar />}

          {/*
            La barra inferior va `fixed`, por eso no es una fila de la grilla y el contenido
            lleva `pb-20` para no quedar debajo (solo con sesión).
          */}
          <BottomNav />
        </>
        <Toaster richColors />
      </ThemeProvider>
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-left" />}
    </>
  );
}
