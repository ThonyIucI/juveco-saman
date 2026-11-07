import { type MouseEvent, type PointerEvent, useRef, useState } from "react";

import { copyToClipboard } from "@/common/utils/clipboard";

/** Cuánto hay que mantener presionado para copiar. */
const LONG_PRESS_MS = 450;
/* Si el dedo se mueve más que esto, está haciendo scroll: no se copia. */
const MOVE_TOLERANCE_PX = 10;
const VIBRATION_MS = 15;

type TGetText = () => string | Promise<string> | null;

/**
 * Copiar con pulsación larga, para el celular (acordado 2026-10-22): mantener presionado un
 * dato lo copia al soltar. Se copia **al soltar** y no al cumplirse el tiempo porque el
 * navegador solo deja escribir en el portapapeles durante un toque (en el `pointerup`).
 * Con mouse no hace nada: en escritorio está el botón de copiar.
 */
export const useLongPressCopy = (getText: TGetText, successMessage: string) => {
  const [isArmed, setIsArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const isArmedRef = useRef(false);

  const reset = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = null;
    startRef.current = null;
    isArmedRef.current = false;
    setIsArmed(false);
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") {
      return;
    }
    startRef.current = { x: event.clientX, y: event.clientY };
    timerRef.current = setTimeout(() => {
      isArmedRef.current = true;
      setIsArmed(true);
      navigator.vibrate?.(VIBRATION_MS);
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const start = startRef.current;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > MOVE_TOLERANCE_PX) {
      reset();
    }
  };

  const onPointerUp = () => {
    const shouldCopy = isArmedRef.current;
    reset();
    if (!shouldCopy) {
      return;
    }
    const text = getText();
    if (text !== null) {
      copyToClipboard(text, successMessage);
    }
  };

  return {
    isArmed,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
      /* Android abre su menú con la pulsación larga: se evita, el copiar es nuestro. */
      onContextMenu: (event: MouseEvent<HTMLElement>) => {
        if (startRef.current) {
          event.preventDefault();
        }
      },
    },
  };
};
