import { cn } from "@juveco/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import CopyButton from "@/common/components/copy-button";
import LongPressCopy from "@/common/components/long-press-copy";

interface IDetailSectionProps {
  title: string;
  /** A la derecha del título (p. ej. «Agregar perfil»). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Borde gris y radio chico en vez de sombra, como las cards de actividades (Thony, 2026-11-07). */
  isBordered?: boolean;
}

/**
 * Card con título de un detalle («Cuenta», «Nota»…), como las de id-pos: el encabezado va
 * sobre un fondo más oscuro que el cuerpo.
 */
export function DetailSection({ title, action, children, className, isBordered = false }: IDetailSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden bg-card",
        isBordered ? "rounded-sm border border-border" : "rounded-2xl shadow-card",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-h-12 items-center justify-between gap-2 bg-muted px-4 py-1.5",
          isBordered && "border-b border-border",
        )}
      >
        <h3 className="font-heading text-sm font-bold text-foreground">{title}</h3>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

/**
 * Las filas `DetailRow` de una sección. Comparten columnas (etiqueta · valor): todos los
 * valores arrancan en el mismo punto, sin importar lo largo de cada etiqueta.
 */
export function DetailList({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-3">{children}</div>
  );
}

interface IDetailRowProps {
  icon: LucideIcon;
  label: string;
  /** Sin valor se muestra «—» en gris: el dato todavía no está, no se inventa. */
  children?: ReactNode;
  /** Botones a la izquierda del valor, dentro de su columna (p. ej. el ojo). */
  actions?: ReactNode;
  /**
   * Para copiar el dato: en escritorio, un botón de copiar a la izquierda del valor; en el
   * celular, manteniendo presionado el valor.
   */
  copy?: { label: string; successMessage: string; getText: () => string | Promise<string> | null };
}

/**
 * Una fila **ícono + etiqueta: valor** del detalle. Va dentro de `DetailList`. Los botones
 * van dentro de la columna del valor y a su izquierda: no mueven las etiquetas ni se corren
 * cuando el texto cambia de ancho.
 */
export function DetailRow({ icon: Icon, label, children, actions, copy }: IDetailRowProps) {
  const isEmpty = children === undefined || children === null || children === "";
  const value = isEmpty ? "—" : children;

  return (
    <div className="col-span-2 grid min-h-11 grid-cols-subgrid items-center py-1">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon aria-hidden className="size-4.5 shrink-0" />
        {label}:
      </span>
      <div className="flex min-w-0 items-center gap-1">
        {(copy || actions) && (
          <div className="-ml-2 flex shrink-0 items-center">
            {copy && <CopyButton label={copy.label} getText={copy.getText} className="hidden md:inline-flex" />}
            {actions}
          </div>
        )}
        <span
          className={cn(
            "min-w-0 truncate font-semibold",
            isEmpty ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {copy && !isEmpty ? (
            <LongPressCopy getText={copy.getText} successMessage={copy.successMessage}>
              {value}
            </LongPressCopy>
          ) : (
            value
          )}
        </span>
      </div>
    </div>
  );
}
