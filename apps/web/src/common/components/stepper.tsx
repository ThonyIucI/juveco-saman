import { cn } from "@juveco/ui/lib/utils";
import { Check } from "lucide-react";

interface IStepperProps {
  steps: readonly { title: string }[];
  current: number;
  /** Tocar un paso salta a él; sin esto, los pasos solo se muestran. */
  onStepClick?: (index: number) => void;
}

/**
 * Pasos numerados de un formulario (1, 2, 3): el actual resaltado, los ya hechos con ✓ y una
 * línea que los une. Debajo de cada número, su nombre; en celular solo el del paso actual.
 */
export default function Stepper({ steps, current, onStepClick }: IStepperProps) {
  return (
    <ol className="flex items-start">
      {steps.map((step, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <li key={step.title} className="relative flex flex-1 flex-col items-center gap-1.5">
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2",
                  index <= current ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <button
              type="button"
              disabled={!onStepClick}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Paso ${index + 1}: ${step.title}`}
              onClick={() => onStepClick?.(index)}
              className={cn(
                "relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
                onStepClick ? "cursor-pointer" : "cursor-default",
                isCurrent && "border-primary bg-primary text-primary-foreground",
                isDone && "border-primary bg-card text-primary",
                !isCurrent && !isDone && "border-border bg-card text-muted-foreground",
              )}
            >
              {isDone ? <Check className="size-4" /> : index + 1}
            </button>
            <span
              className={cn(
                "text-center text-xs",
                isCurrent ? "font-semibold text-foreground" : "hidden text-muted-foreground sm:block",
              )}
            >
              {step.title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
