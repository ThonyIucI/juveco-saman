import { cn } from "@juveco/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface IFormSectionProps {
  icon: LucideIcon;
  title: ReactNode;
  /** A la derecha del título (p. ej. «Vaciar»). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Una sección de un formulario largo, como las del carrito de id-pos (acordado 2026-11-04):
 * **ícono + título** y su contenido, sobre blanco. Las secciones van dentro de
 * `FormSections`, que las separa con una franja gris: así se ve dónde termina el cliente y
 * empieza el carrito, sin bordes.
 */
export function FormSection({ icon: Icon, title, action, children, className }: IFormSectionProps) {
  return (
    <section className={cn("space-y-3 bg-card px-4 py-4", className)}>
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 font-heading font-semibold text-foreground">
          <Icon aria-hidden className="size-4.5 shrink-0 text-muted-foreground" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** El fondo gris entre secciones: el «vacío» que las separa. */
export function FormSections({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-2.5 bg-muted", className)}>{children}</div>;
}
