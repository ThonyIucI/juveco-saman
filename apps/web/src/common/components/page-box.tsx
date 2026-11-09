import { cn } from "@juveco/ui/lib/utils";
import type { ReactNode } from "react";

interface IPageBoxProps {
  children: ReactNode;
  className?: string;
}

/**
 * Caja blanca de una página en escritorio, sobre el fondo gris (Thony, 2026-11-09), como
 * Clientes de id-pos: una para el encabezado y otra para el cuerpo, separadas por un espacio.
 * Sin borde y con radio de 12 px. En celular no dibuja nada: el fondo ya es blanco.
 */
export default function PageBox({ children, className }: IPageBoxProps) {
  return <section className={cn("md:rounded-xl md:bg-card md:p-5", className)}>{children}</section>;
}
