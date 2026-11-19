import { cn } from "@juveco/ui/lib/utils";
import type { ReactNode } from "react";

interface IPageBoxProps {
  children: ReactNode;
  className?: string;
  /** El cuerpo de la página: llega hasta abajo dentro de `PageContainer`, cargando o no. */
  isFill?: boolean;
}

/**
 * Caja blanca de una página en escritorio, sobre el fondo gris (Thony, 2026-11-09), como
 * Clientes de id-pos: una para el encabezado y otra para el cuerpo, separadas por un espacio.
 * Con radio de 12 px; sin borde en claro y con uno fino en oscuro, donde el fondo es casi negro
 * (Thony, 2026-11-19). En celular no dibuja nada: el fondo ya es del color de la caja.
 */
export default function PageBox({ children, className, isFill = false }: IPageBoxProps) {
  return (
    <section className={cn("md:rounded-xl md:bg-card md:p-5 dark:md:border dark:md:border-border", isFill && "md:flex-1", className)}>{children}</section>
  );
}
