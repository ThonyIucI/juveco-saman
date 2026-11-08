import { Button } from "@juveco/ui/components/button";
import { cn } from "@juveco/ui/lib/utils";
import { ChevronLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { EASE_DRAWER } from "@/common/constants/motion";
import { lockPageScroll } from "@/common/utils/scroll-lock";

const ENTER_SECONDS = 0.3;
/* Salir siempre más rápido que entrar. */
const EXIT_SECONDS = 0.2;

interface ISidePanelProps {
  open: boolean;
  /** Para el lector de pantalla: qué detalle es. */
  label: string;
  /** Texto del botón de volver: a dónde se vuelve («Cuentas»). */
  backLabel: string;
  /** A la derecha del encabezado: switch, `⋯`… */
  actions?: ReactNode;
  children: ReactNode;
  onClose: () => void;
}

/**
 * Detalle lateral, como el detalle de cliente de id-pos: en celular ocupa la pantalla con
 * «‹ Volver» arriba; en escritorio es un panel a la derecha sobre la lista, que se sigue
 * viendo detrás. Escape o tocar afuera lo cierran, y el fondo no scrollea mientras está.
 */
export default function SidePanel({
  open,
  label,
  backLabel,
  actions,
  children,
  onClose,
}: ISidePanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  /* La sombra del encabezado solo aparece cuando el contenido ya bajó (Thony, 2026-11-08). */
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsScrolled(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      /* Con una modal o confirmación encima, Escape es de ella: el panel sigue abierto. */
      const hasModalOnTop = document.querySelector(
        '[aria-modal="true"]:not([data-side-panel])',
      );
      if (event.key === "Escape" && !hasModalOnTop) {
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    const releaseScroll = lockPageScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      releaseScroll();
    };
  }, [open]);

  const hidden = prefersReducedMotion ? { opacity: 0 } : { transform: "translateX(100%)" };
  const visible = prefersReducedMotion ? { opacity: 1 } : { transform: "translateX(0%)" };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex justify-end bg-foreground/30 backdrop-blur-[2px]"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: prefersReducedMotion ? 0 : EXIT_SECONDS } }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={label}
            data-side-panel
            className="flex h-full w-full flex-col bg-background shadow-sheet md:max-w-md"
            initial={hidden}
            animate={visible}
            exit={{
              ...hidden,
              transition: { duration: prefersReducedMotion ? 0 : EXIT_SECONDS, ease: EASE_DRAWER },
            }}
            transition={{ duration: prefersReducedMotion ? 0 : ENTER_SECONDS, ease: EASE_DRAWER }}
          >
            <header
              className={cn(
                "relative z-10 flex shrink-0 items-center justify-between gap-2 bg-card px-2 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2 transition-shadow duration-200",
                isScrolled && "shadow-edge-bottom",
              )}
            >
              <Button variant="ghost" className="gap-1 px-2 font-heading text-sm" onClick={onClose}>
                <ChevronLeft className="size-5" />
                {backLabel}
              </Button>
              {actions && <div className="flex items-center gap-1 pr-1">{actions}</div>}
            </header>

            <div
              onScroll={(event) => setIsScrolled(event.currentTarget.scrollTop > 2)}
              className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
            >
              {children}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
