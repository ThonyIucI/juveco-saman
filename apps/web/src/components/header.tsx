import { cn } from "@juveco/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";

import { useChromeHidden } from "@/common/hooks/use-chrome-hidden";
import { useHasSidebar, useNavItems } from "@/common/hooks/use-nav-items";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

/** Sin encabezado: el login, que es pantalla completa y trae su propio control de tema. */
const CHROMELESS_ROUTES: readonly string[] = ["/login"];

export default function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  /* Los enlaces dependen del rol. */
  const navItems = useNavItems();
  const hasSidebar = useHasSidebar();
  const isHidden = useChromeHidden();

  if (CHROMELESS_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    /* Al bajar se esconde junto con la barra inferior; al subir vuelven los dos. */
    <motion.header
      className="sticky top-0 z-20 bg-card/90 shadow-edge-bottom backdrop-blur"
      initial={false}
      animate={{ y: isHidden ? "-100%" : 0 }}
      transition={{ duration: 0.2, ease: isHidden ? "easeIn" : "easeOut" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-heading text-lg font-extrabold text-primary">
            <img src="/logo.png" alt="" className="size-9" />
            Juveco Samán
          </Link>

          {/*
            En móvil están la barra inferior y el menú lateral, y en escritorio el menú
            lateral fijo: no se repiten acá. Solo se ven en tablets angostas (`sm` a `md`).
          */}
          <nav
            className={cn(
              "hidden gap-4 font-heading text-sm font-semibold sm:flex",
              hasSidebar && "md:hidden",
            )}
          >
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg px-1 text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      {/* Firma: las seis manos del logo, una sola vez por pantalla. */}
      <div aria-hidden className="rainbow-band h-1" />
    </motion.header>
  );
}
