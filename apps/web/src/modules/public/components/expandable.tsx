import { cn } from "@juveco/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useId, useState } from "react";

import { EASE_OUT } from "@/common/constants/motion";

interface IExpandableProps {
  /** Dice qué se va a ver: «Ver directiva», «Ver el detalle»; nunca un «Ver más» genérico. */
  label: string;
  /** El botón abierto; por defecto «Ver menos». */
  openLabel?: string;
  /** Sobre azul marino el botón va en dorado (contraste AA). */
  isOnNavy?: boolean;
  /** Clase del contenedor del botón (separación, borde). */
  className?: string;
  /** Lo que se despliega, cerrado por defecto. */
  children: ReactNode;
}

/**
 * «Ver más» por secciones (Thony, 2026-11-25): cada sección muestra lo esencial y el resto se
 * despliega en el mismo lugar. El contenido sigue en la página pero cerrado va `inert`: no se
 * enfoca con el teclado ni lo lee un lector de pantalla. Sin animación con «menos movimiento».
 */
export default function Expandable({ label, openLabel = "Ver menos", isOnNavy = false, className, children }: IExpandableProps) {
  const isReduced = useReducedMotion() ?? false;
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md text-sm font-medium transition-colors",
          isOnNavy ? "text-gold hover:text-white" : "text-primary hover:underline dark:text-blue-400",
        )}
      >
        {isOpen ? openLabel : label}
        <ChevronDown
          aria-hidden
          className={cn("size-4 transition-transform duration-200 motion-reduce:transition-none", isOpen && "rotate-180")}
        />
      </button>
      <motion.div
        id={contentId}
        inert={!isOpen}
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: isReduced ? 0 : 0.3, ease: EASE_OUT }}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );
}
