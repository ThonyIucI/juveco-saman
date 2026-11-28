import { EUserCondition, userConditionLabels } from "@juveco/shared/user-profiles";
import { cn } from "@juveco/ui/lib/utils";

const CONDITIONS = Object.values(EUserCondition);

interface IConditionChipsProps {
  /** El id del `Label` que nombra al grupo. */
  labelledBy: string;
  value: readonly string[];
  onChange: (value: string[]) => void;
}

/** Condiciones de prioridad de una persona: se prenden y se apagan, se puede elegir varias. */
export default function ConditionChips({ labelledBy, value, onChange }: IConditionChipsProps) {
  const toggle = (condition: EUserCondition) =>
    onChange(value.includes(condition) ? value.filter((item) => item !== condition) : [...value, condition]);

  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {CONDITIONS.map((condition) => {
        const isSelected = value.includes(condition);
        return (
          <button
            key={condition}
            type="button"
            aria-pressed={isSelected}
            onClick={() => toggle(condition)}
            className={cn(
              "flex h-control cursor-pointer items-center rounded-lg border px-4 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-field-border bg-field text-foreground hover:bg-muted",
            )}
          >
            {userConditionLabels[condition]}
          </button>
        );
      })}
    </div>
  );
}
