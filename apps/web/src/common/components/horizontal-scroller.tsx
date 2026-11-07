import { IconButton } from "@juveco/ui/components/icon-button";
import { cn } from "@juveco/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

/** Cuánto corre cada flecha: casi el ancho visible, para no saltarse opciones. */
const SCROLL_RATIO = 0.8;
/** Margen en px para considerar que llegó al borde (evita flechas por redondeo). */
const EDGE_TOLERANCE = 2;
/*
  Las flechas flotan con la sombra de lo elevado (la misma de la pestaña del menú lateral):
  sin ella se veían como íconos sueltos (Thony, 2026-11-06).
*/
const ARROW_CLASS = "hidden rounded-full bg-card shadow-elevated sm:flex";

interface IScrollEdges {
  canLeft: boolean;
  canRight: boolean;
}

interface IHorizontalScrollerProps {
  children: ReactNode;
  /** Para el lector de pantalla («Servicio», «Mes en que finaliza»). */
  label: string;
  /** El rol de la fila: `radiogroup` si sus hijos se eligen. */
  role?: string;
  previousLabel?: string;
  nextLabel?: string;
  /** Clases de la fila (el `gap`, el padding). */
  className?: string;
}

/**
 * Una fila con **scroll horizontal**, sin barra visible (Thony, 2026-11-06: funciona, pero
 * no se ve bien) y, en escritorio, con **flechas a los lados** cuando no entra todo. En
 * celular se desliza con el dedo. La usan los servicios del catálogo y los meses del
 * periodo de alquiler.
 */
export default function HorizontalScroller({
  children,
  label,
  role,
  previousLabel = "Ver anteriores",
  nextLabel = "Ver más",
  className,
}: IHorizontalScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState<IScrollEdges>({ canLeft: false, canRight: false });

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const canLeft = scroller.scrollLeft > EDGE_TOLERANCE;
    const canRight = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - EDGE_TOLERANCE;
    setEdges((previous) =>
      previous.canLeft === canLeft && previous.canRight === canRight ? previous : { canLeft, canRight },
    );
  }, []);

  /* Se mide al cambiar el ancho de la fila o de su contenido (más o menos opciones). */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    for (const child of Array.from(scroller.children)) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [measure, children]);

  const scrollBy = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    scroller?.scrollBy({ left: direction * scroller.clientWidth * SCROLL_RATIO, behavior: "smooth" });
  };

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {edges.canLeft && (
        <IconButton label={previousLabel} size="xs" className={ARROW_CLASS} onClick={() => scrollBy(-1)}>
          <ChevronLeft />
        </IconButton>
      )}
      <div
        ref={scrollerRef}
        role={role}
        aria-label={label}
        onScroll={measure}
        className={cn(
          "-mx-1 flex min-w-0 flex-1 overflow-x-auto px-1 py-1 scrollbar-none",
          className,
        )}
      >
        {children}
      </div>
      {edges.canRight && (
        <IconButton label={nextLabel} size="xs" className={ARROW_CLASS} onClick={() => scrollBy(1)}>
          <ChevronRight />
        </IconButton>
      )}
    </div>
  );
}
