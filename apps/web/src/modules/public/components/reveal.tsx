import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

import { EASE_OUT } from "@/common/constants/motion";

/* Suben 24 px mientras aparecen; una sola vez, cuando una quinta parte ya está a la vista. */
const VIEWPORT = { once: true, amount: 0.2 } as const;

/* Un grupo muy alto (~40 filas en celular) nunca llega al 20 %: basta con que asome. */
const GROUP_VIEWPORT = { once: true, amount: "some" } as const;

const variantsWithDelay = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT, delay } },
});

const itemVariants = variantsWithDelay(0);

interface IRevealProps {
  children: ReactNode;
  className?: string;
  /** Segundos de espera antes de aparecer. */
  delay?: number;
}

/**
 * Una zona que aparece al llegar a ella con el scroll (Thony, 2026-11-25: «que al deslizar
 * aparezcan zonas»). Con «menos movimiento» en el sistema, se muestra quieta.
 */
export function Reveal({ children, className, delay = 0 }: IRevealProps) {
  const isReduced = useReducedMotion();
  if (isReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
      variants={delay > 0 ? variantsWithDelay(delay) : itemVariants}
    >
      {children}
    </motion.div>
  );
}

const groupVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08 } },
};

/** Una grilla cuyos elementos (`RevealItem`) aparecen uno tras otro. */
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  const isReduced = useReducedMotion();
  if (isReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div className={className} initial="hidden" whileInView="shown" viewport={GROUP_VIEWPORT} variants={groupVariants}>
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const isReduced = useReducedMotion();
  if (isReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
