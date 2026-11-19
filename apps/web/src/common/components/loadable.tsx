import { cn } from "@juveco/ui/lib/utils";
import type { ReactNode } from "react";

import { FADE_IN_CLASS } from "@/common/constants/motion";
import { useLoadingPhase } from "@/common/hooks/use-loading-phase";

interface ILoadableProps {
  isLoading: boolean;
  /** Con la forma de lo que va a aparecer (cards, filas…), no un bloque genérico. */
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * La transición entre cargar y mostrar, igual en todas las vistas (Thony, 2026-11-18):
 * - carga rápida (menos de 200 ms): sin esqueleto, el contenido entra con el fundido;
 * - carga lenta: el esqueleto, al menos 300 ms, y luego el contenido con el fundido.
 * Mientras espera los primeros 200 ms no dibuja nada: la caja blanca ya ocupa el lugar.
 */
export default function Loadable({ isLoading, skeleton, children, className }: ILoadableProps) {
  const phase = useLoadingPhase(isLoading);

  if (phase === "waiting") {
    return null;
  }
  if (phase === "skeleton") {
    return <div aria-busy="true" aria-label="Cargando">{skeleton}</div>;
  }
  return <div className={cn(FADE_IN_CLASS, className)}>{children}</div>;
}
