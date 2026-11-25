import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Un número que sube de 0 a su valor cuando aparece en pantalla (una vez). */
export default function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const isReduced = useReducedMotion();
  const [shown, setShown] = useState(isReduced ? value : 0);

  useEffect(() => {
    if (!isInView || isReduced) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, { duration: 1.4, ease: "easeOut", onUpdate: (latest) => setShown(Math.round(latest)) });
    return () => controls.stop();
  }, [isInView, isReduced, value]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
