import { IconButton } from "@juveco/ui/components/icon-button";
import { cn } from "@juveco/ui/lib/utils";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { EASE_DRAWER, EASE_OUT } from "@/common/constants/motion";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { useVisualViewport } from "@/common/hooks/use-visual-viewport";
import { lockPageScroll } from "@/common/utils/scroll-lock";

/** El mismo corte que el `sm:` de Tailwind, para que la animación siga al layout. */
const DESKTOP_QUERY = "(min-width: 640px)";

const ENTER_SECONDS = 0.28;
/* Salir siempre más rápido que entrar. */
const EXIT_SECONDS = 0.18;

/** Margen en px para considerar que el cuerpo llegó al borde (evita sombras por redondeo). */
const EDGE_TOLERANCE = 2;

type TModalWidth = "sm" | "md" | "lg";

const WIDTH_CLASS: Record<TModalWidth, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

interface IModalProps {
  open: boolean;
  title: string;
  description?: string;
  /** Una línea corta bajo el título, fija en el encabezado (p. ej. el correo de la cuenta). */
  subtitle?: string;
  children: ReactNode;
  /** Botones del pie. Van pegados abajo y no se van con el scroll del cuerpo. */
  footer?: ReactNode;
  width?: TModalWidth;
  onClose: () => void;
}

interface IScrollEdges {
  /** El cuerpo ya no está arriba del todo: el encabezado proyecta sombra. */
  isScrolled: boolean;
}

/** Sombra del encabezado solo cuando el cuerpo ya bajó (el pie la lleva siempre). */
const useScrollEdges = (enabled: boolean) => {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState<IScrollEdges>({ isScrolled: false });

  const measure = useCallback(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }
    const isScrolled = body.scrollTop > EDGE_TOLERANCE;
    setEdges((previous) => (previous.isScrolled === isScrolled ? previous : { isScrolled }));
  }, []);

  /* El alto cambia al abrir el teclado o al aparecer un error de validación. */
  useEffect(() => {
    const body = bodyRef.current;
    if (!enabled || !body) {
      return;
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    if (body.firstElementChild) {
      observer.observe(body.firstElementChild);
    }
    return () => observer.disconnect();
  }, [enabled, measure]);

  return { bodyRef, edges, measure };
};

/**
 * Modal de la app: **hoja inferior en celular y tarjeta centrada en escritorio**.
 *
 * Una sola superficie separada del fondo por sombra, sin bordes que corten encabezado,
 * cuerpo y pie: el pie se separa con sombra hacia arriba, como en el saas. El cuerpo hace scroll por su cuenta y el pie se queda fijo, así el botón
 * de guardar nunca queda a tres pantallas de distancia.
 *
 * Con el teclado abierto se ancla al viewport visible. Por eso el encabezado es solo el
 * título: la descripción va dentro del cuerpo y se va con el scroll, y el campo que se está
 * escribiendo conserva casi todo el alto disponible.
 */
export default function Modal({
  open,
  title,
  description,
  subtitle,
  children,
  footer,
  width = "md",
  onClose,
}: IModalProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const prefersReducedMotion = useReducedMotion();
  const viewport = useVisualViewport(open);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const { bodyRef, edges, measure } = useScrollEdges(open && isPanelMounted);

  /* Siempre el último `onClose`, sin volver a correr los efectos cada vez que cambia. */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  /*
    Escape cierra, y el fondo se congela: sin esto la página de atrás scrollea sola. Depende
    solo de `open`: si dependiera de `onClose` (una función nueva en cada render), el bloqueo
    se quitaba y se ponía en cada render y podía quedar pegado con el scroll trabado.
  */
  useEffect(() => {
    if (!open) {
      setIsPanelMounted(false);
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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

  const hidden = prefersReducedMotion
    ? { opacity: 0 }
    : isDesktop
      ? { opacity: 0, transform: "scale(0.96)" }
      : { transform: "translateY(100%)" };

  const visible = prefersReducedMotion
    ? { opacity: 1 }
    : isDesktop
      ? { opacity: 1, transform: "scale(1)" }
      : { transform: "translateY(0%)" };

  const ease = isDesktop ? EASE_OUT : EASE_DRAWER;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-x-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-[2px] sm:items-center sm:p-4"
          /*
            Se ancla al viewport visible y no al layout: en celular, al abrirse el
            teclado, el layout no se encoge y la hoja quedaría debajo de las teclas.
          */
          style={{ top: viewport.offsetTop, height: viewport.height || "100%" }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: prefersReducedMotion ? 0 : EXIT_SECONDS } }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: EASE_OUT }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "flex max-h-full w-full flex-col overflow-hidden rounded-t-3xl bg-card pb-[env(safe-area-inset-bottom)] text-foreground shadow-sheet",
              "sm:max-h-[90vh] sm:rounded-3xl sm:pb-0",
              WIDTH_CLASS[width],
            )}
            initial={hidden}
            animate={visible}
            exit={{
              ...hidden,
              transition: { duration: prefersReducedMotion ? 0 : EXIT_SECONDS, ease: EASE_OUT },
            }}
            transition={{ duration: prefersReducedMotion ? 0 : ENTER_SECONDS, ease }}
            onAnimationStart={() => setIsPanelMounted(true)}
          >
            <div
              className={cn(
                "relative z-10 flex shrink-0 flex-col bg-card transition-shadow duration-200",
                edges.isScrolled && "shadow-edge-bottom",
              )}
            >
              {/* Agarradera: en celular avisa que es una hoja que se puede bajar. */}
              <div className="flex justify-center pt-2.5 sm:hidden">
                <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="flex items-center justify-between gap-3 px-5 pt-2 pb-3 sm:pt-5">
                <div className="min-w-0">
                  <h2 className="font-heading text-xl font-bold wrap-break-word text-foreground">{title}</h2>
                  {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                {/* Con fondo gris, no solo la ✕: la vista lo encuentra rápido (Thony, 2026-11-06). */}
                <IconButton label="Cerrar" isFilled onClick={onClose}>
                  <X />
                </IconButton>
              </div>
            </div>

            <div ref={bodyRef} onScroll={measure} className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
              <div>
                {description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
                {children}
              </div>
            </div>

            {footer && (
              /* Lado a lado siempre: en celular se reparten el ancho, en escritorio van a la derecha. */
              /*
                Como en el saas: el pie **siempre** se separa del cuerpo con una sombra hacia
                arriba (nunca con borde), haya scroll o no.
              */
              <div className="relative z-10 flex shrink-0 gap-2 bg-card px-5 pt-3 pb-4 shadow-edge-top *:flex-1 sm:justify-end sm:*:flex-none">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
