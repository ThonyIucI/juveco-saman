import { cn } from "@juveco/ui/lib/utils";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { useChromeHidden } from "@/common/hooks/use-chrome-hidden";

/** Alto del encabezado (`h-16`): la barra se pega justo debajo mientras se ve. */
const HEADER_HEIGHT_PX = 64;

interface IStickyToolbarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Como el `StickyToolbar` del saas: la barra del buscador (y filtros) se pega arriba al
 * bajar. En reposo es parte de la página; pegada se vuelve vidrio (card translúcida con
 * blur y sombra) para que se note que el contenido pasa por debajo.
 *
 * Acá la página scrollea con la ventana: se pega bajo el encabezado y, cuando el encabezado
 * se esconde al bajar, sube hasta el borde con la misma curva.
 */
export default function StickyToolbar({ children, className }: IStickyToolbarProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const isChromeHidden = useChromeHidden();
  const stickyTop = isChromeHidden ? 0 : HEADER_HEIGHT_PX;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }
    /* El centinela queda justo antes de la barra: si sale por arriba, la barra está pegada. */
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry?.isIntersecting),
      { rootMargin: `-${stickyTop}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [stickyTop]);

  return (
    <>
      {/* `mb-0`: dentro de un `space-y-*` el centinela vacío recibía margen y dejaba un hueco. */}
      <div ref={sentinelRef} aria-hidden className="mb-0" />
      <div
        style={{ top: stickyTop }}
        className={cn(
          /*
            Equidistante (Thony, 2026-11-08): el `py-2` es para el vidrio al pegarse. `-mt-2`
            se lo descuenta al margen de arriba y `mb-2` completa el de abajo: 16 px a cada lado.
          */
          "sticky z-10 -mx-4 px-4 py-2 -mt-2 mb-2",
          "transition-[top,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          isStuck ? "bg-card/80 shadow-edge-bottom backdrop-blur-md" : "bg-transparent",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
