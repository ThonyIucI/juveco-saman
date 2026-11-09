import { cn } from "@juveco/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";

import { useChromeHidden } from "@/common/hooks/use-chrome-hidden";
import { useQuickAccessItems } from "@/common/hooks/use-nav-items";

/**
 * Navegación de pulgar para móvil. Solo aparece en pantallas chicas: en escritorio los
 * mismos enlaces viven en el encabezado, así que no se duplican a la vista.
 *
 * Va en la raíz y **no dentro del encabezado**: el login no lleva encabezado, y así la
 * barra no depende de él.
 *
 * Sin sesión no renderiza nada, así que un visitante no la ve. Al bajar se esconde y al
 * subir vuelve (`useChromeHidden`), igual que el encabezado.
 *
 * Lleva `pb-[env(safe-area-inset-bottom)]` por la barra de gestos de los celulares sin
 * botones físicos, que si no se come la fila de íconos.
 */
export default function BottomNav() {
  const items = useQuickAccessItems();
  const isHidden = useChromeHidden();

  if (items.length === 0) {
    return null;
  }

  return (
    <motion.nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      initial={false}
      animate={{ y: isHidden ? "100%" : 0 }}
      transition={{ duration: 0.2, ease: isHidden ? "easeIn" : "easeOut" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {items.map(({ to, shortLabel, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className={cn(
                "group flex flex-col items-center gap-1 px-2 py-2 font-heading text-xs font-medium text-muted-foreground transition-colors",
                /* La actual, además de la píldora, con el texto en color y más peso. */
                "[&.active]:font-semibold [&.active]:text-primary",
              )}
            >
              {/* Como WhatsApp o Telegram: la sección actual con una píldora de fondo (Thony, 2026-11-09). */}
              <span className="flex h-8 w-14 items-center justify-center rounded-full transition-colors group-[.active]:bg-primary/12">
                <Icon className="size-6" />
              </span>
              {shortLabel}
            </Link>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
