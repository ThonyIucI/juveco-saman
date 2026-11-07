import { IconButton } from "@juveco/ui/components/icon-button";
import { userRoleLabels } from "@juveco/shared/roles";
import { ChevronRight, LogOut, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { EASE_DRAWER } from "@/common/constants/motion";
import { sidebarEntriesForRole } from "@/common/constants/routes";
import { useSessionRole } from "@/common/hooks/use-session-role";
import { useSignOut } from "@/common/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";

import SidebarNav from "./sidebar-nav";

const DRAWER_ENTER_SECONDS = 0.3;
/* Salir siempre más rápido que entrar. */
const DRAWER_EXIT_SECONDS = 0.2;

interface ISidebarPanelProps {
  /** Solo en celular: el panel se cierra al elegir un módulo. */
  onClose?: () => void;
}

/** Contenido del menú: quién es, los módulos y salir. */
function SidebarPanel({ onClose }: ISidebarPanelProps) {
  const { data: session } = authClient.useSession();
  const role = useSessionRole();
  const entries = sidebarEntriesForRole(role);
  const signOut = useSignOut();

  return (
    <aside className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground shadow-sheet md:w-64 md:border-r md:border-border md:shadow-none">
      <div className="space-y-4 px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-bold text-foreground">
              {session?.user.name}
            </p>
            {role && <p className="text-sm text-muted-foreground">{userRoleLabels[role]}</p>}
          </div>
          {onClose && (
            <IconButton size="md" label="Cerrar menú" isFilled onClick={onClose}>
              <X />
            </IconButton>
          )}
        </div>
      </div>

      <nav aria-label="Módulos" className="flex-1 overflow-y-auto px-3 pb-4">
        <SidebarNav entries={entries} onNavigate={onClose} />
      </nav>

      {/* El pie se separa con sombra, no con borde (como el pie de la modal). */}
      <div className="px-3 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-edge-top">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 font-heading text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

/**
 * Menú lateral, como el de id-pos: arriba quién es, luego los módulos. **Complementa** la
 * barra inferior, no la reemplaza.
 *
 * - Escritorio (`md:`): fijo a la izquierda; el layout le deja `md:pl-64`.
 * - Celular: panel que entra desde el borde con la pestaña `›`.
 */
export default function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const duration = (seconds: number) => (prefersReducedMotion ? 0 : seconds);

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-30 hidden md:flex">
        <SidebarPanel />
      </div>

      {/* Pestaña pegada al borde, como en id-pos. */}
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={() => setIsOpen(true)}
        className="fixed top-1/2 left-0 z-30 flex h-14 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-2xl bg-card text-foreground shadow-elevated transition-transform active:scale-95 md:hidden"
      >
        <ChevronRight className="size-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: duration(0.2) } }}
              exit={{ opacity: 0, transition: { duration: duration(DRAWER_EXIT_SECONDS) } }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menú"
              className="relative flex h-full"
              initial={{ transform: "translateX(-100%)" }}
              animate={{
                transform: "translateX(0%)",
                transition: { duration: duration(DRAWER_ENTER_SECONDS), ease: EASE_DRAWER },
              }}
              exit={{
                transform: "translateX(-100%)",
                transition: { duration: duration(DRAWER_EXIT_SECONDS), ease: EASE_DRAWER },
              }}
            >
              <SidebarPanel onClose={close} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
