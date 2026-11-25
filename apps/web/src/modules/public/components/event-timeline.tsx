import { motion, useReducedMotion } from "motion/react";

import { scrollToSection } from "@/modules/public/utils/scroll";

import { RevealGroup, RevealItem } from "./reveal";

export interface ITimelineStep {
  /** La sección a la que baja; sin id, el paso no lleva enlace (el evento mismo). */
  targetId?: string;
  title: string;
  date: string;
}

/**
 * Cómo se llega al evento, paso por paso: las actividades que juntan los fondos y, al final,
 * el evento. En escritorio va en una fila con una línea que se dibuja al aparecer.
 */
export default function EventTimeline({ steps }: { steps: ITimelineStep[] }) {
  const isReduced = useReducedMotion();

  return (
    <div className="relative">
      <motion.div
        aria-hidden
        className="absolute top-5 right-[8%] left-[8%] hidden h-0.5 origin-left bg-primary/25 md:block"
        initial={isReduced ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      <RevealGroup className="relative grid gap-6 md:grid-flow-col md:auto-cols-fr">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const content = (
            <>
              <span
                className={
                  isLast
                    ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-gold font-heading font-extrabold text-gold-foreground"
                    : "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading font-extrabold text-primary-foreground"
                }
              >
                {index + 1}
              </span>
              <span className="md:mt-3">
                <span className="block font-heading font-bold text-foreground">{step.title}</span>
                <span className="block text-sm text-muted-foreground">{step.date}</span>
              </span>
            </>
          );
          return (
            <RevealItem key={step.title}>
              {step.targetId ? (
                <button
                  type="button"
                  onClick={() => step.targetId && scrollToSection(step.targetId)}
                  className="flex w-full cursor-pointer items-center gap-4 rounded-md text-left transition-opacity hover:opacity-80 md:flex-col md:items-center md:text-center"
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-center gap-4 md:flex-col md:items-center md:text-center">{content}</div>
              )}
            </RevealItem>
          );
        })}
      </RevealGroup>
    </div>
  );
}
