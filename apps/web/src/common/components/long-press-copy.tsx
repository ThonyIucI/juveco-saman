import { cn } from "@juveco/ui/lib/utils";
import type { ReactNode } from "react";

import { useLongPressCopy } from "@/common/hooks/use-long-press-copy";

interface ILongPressCopyProps {
  /** Lo que se copia; puede ser una promesa (p. ej. la contraseña, que viene del server). */
  getText: () => string | Promise<string> | null;
  /** El toast al copiar: «Correo copiado». */
  successMessage: string;
  children: ReactNode;
  className?: string;
}

/**
 * Un dato que se copia manteniéndolo presionado en el celular. Mientras está listo para
 * copiar se resalta; en pantallas táctiles no se selecciona el texto ni sale el menú del
 * sistema, para que no compitan con el copiar.
 */
export default function LongPressCopy({ getText, successMessage, children, className }: ILongPressCopyProps) {
  const { isArmed, handlers } = useLongPressCopy(getText, successMessage);

  return (
    <span
      {...handlers}
      className={cn(
        "-mx-1 rounded-md px-1 transition-colors pointer-coarse:select-none pointer-coarse:[-webkit-touch-callout:none]",
        isArmed && "bg-primary/10 text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}
