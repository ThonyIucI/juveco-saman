import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const DURATION_S = 1.2;

interface ICountUpProps {
  value: number;
  /** Cómo se escribe el número en cada cuadro de la animación (por defecto, entero). */
  format?: (value: number) => string;
  className?: string;
}

/** Un número que sube de 0 a su valor al entrar en vista (una vez); quieto con «menos movimiento». */
export default function CountUp({ value, format = (current) => String(Math.round(current)), className }: ICountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const isReduced = useReducedMotion() ?? false;
  const [shown, setShown] = useState(isReduced ? value : 0);

  useEffect(() => {
    if (isReduced) {
      setShown(value);
      return;
    }
    if (!isInView) {
      return;
    }
    const controls = animate(0, value, { duration: DURATION_S, ease: "easeOut", onUpdate: setShown });
    return () => controls.stop();
  }, [isInView, isReduced, value]);

  return (
    <span ref={ref} className={className}>
      {format(shown)}
    </span>
  );
}
