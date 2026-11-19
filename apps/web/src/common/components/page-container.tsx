import { cn } from "@juveco/ui/lib/utils";
import type { ReactNode } from "react";

interface IPageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * El contenedor de toda página con sesión (Thony, 2026-11-17): ocupa el alto disponible y
 * apila las cajas en columna. Con `PageBox isFill` en el cuerpo, la caja blanca llega hasta
 * abajo siempre, cargando o con poco contenido, y el fondo no salta al terminar de cargar.
 */
export default function PageContainer({ children, className }: IPageContainerProps) {
  return <div className={cn("mx-auto flex min-h-full w-full max-w-7xl flex-col gap-4 p-4", className)}>{children}</div>;
}
