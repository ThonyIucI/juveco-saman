import { IconButton, type TIconButtonVariants } from "@juveco/ui/components/icon-button";
import { cn } from "@juveco/ui/lib/utils";
import { Check, Copy, Loader2, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type MouseEvent, useEffect, useRef, useState } from "react";

import { EASE_OUT } from "@/common/constants/motion";
import { copyToClipboard } from "@/common/utils/clipboard";

/** Cuánto se ve el check antes de volver al ícono de copiar. */
const COPIED_MS = 2000;
/* El «cargando» se ve al menos esto: si copiar es instantáneo, igual se nota que pasó algo. */
const MIN_LOADING_MS = 350;

type TCopyState = "idle" | "copying" | "copied";


interface ICopyButtonProps {
  /**
   * Lo que se copia. Puede ser una promesa (lo que todavía viene del server, como el acceso
   * de una cuenta). `null` = todavía no se puede: no copia (quien llama ya avisó por qué).
   */
  getText: () => string | Promise<string> | null;
  /** Para el lector de pantalla y el tooltip: «Copiar correo». */
  label: string;
  /** `lg`: el de 52 px de las filas con WhatsApp al lado. */
  size?: "sm" | "lg";
  /** El ícono en reposo; por defecto, el de copiar (p. ej. `SendHorizontal` para el acceso). */
  icon?: LucideIcon;
  /** El color en reposo; al copiar pasa a `primary` con el check. */
  tone?: TIconButtonVariants["tone"];
  isBordered?: boolean;
  isFilled?: boolean;
  className?: string;
}

/**
 * Botón de copiar con su propia respuesta (acordado 2026-10-13): al tocarlo pasa a
 * **cargando**, después a un **check** por dos segundos y vuelve al ícono de copiar. Así no
 * hace falta un toast de «Copiado»; si algo falla, el error sí sale en un toast.
 *
 * Nunca se desactiva: mientras copia o muestra el check, un toque más no hace nada.
 */
export default function CopyButton({
  getText,
  label,
  size = "sm",
  icon = Copy,
  tone = "neutral",
  isBordered = false,
  isFilled = false,
  className,
}: ICopyButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<TCopyState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    /* No abre la fila o la card que lo contiene. */
    event.stopPropagation();
    if (state !== "idle") {
      return;
    }
    const text = getText();
    if (text === null) {
      return;
    }

    setState("copying");
    const [isCopied] = await Promise.all([
      copyToClipboard(text, null),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
    if (!isMountedRef.current) {
      return;
    }
    if (!isCopied) {
      setState("idle");
      return;
    }
    setState("copied");
    timerRef.current = setTimeout(() => setState("idle"), COPIED_MS);
  };

  const Icon = { idle: icon, copying: Loader2, copied: Check }[state];

  return (
    <IconButton
      label={label}
      size={size}
      tone={state === "copied" ? "primary" : tone}
      isBordered={isBordered}
      isFilled={isFilled}
      aria-label={state === "copied" ? "Copiado" : label}
      aria-busy={state === "copying"}
      className={className}
      onClick={handleClick}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          className="flex"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.5)" }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.5)" }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.16, ease: EASE_OUT }}
        >
          <Icon
            className={cn(
              size === "lg" ? "size-6" : "size-4",
              state === "copying" && "animate-spin motion-reduce:animate-none",
            )}
          />
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}
