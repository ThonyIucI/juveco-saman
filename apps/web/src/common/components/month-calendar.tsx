import { IconButton } from "@juveco/ui/components/icon-button";
import { cn } from "@juveco/ui/lib/utils";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { todayIso } from "@/common/utils/format-date";

/* La semana empieza el lunes, como en Perú. */
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

interface IMonthCalendarProps {
  /** El día elegido, «2026-11-05». */
  value: string;
  /**
   * Opcional: el otro extremo de un rango (antes o después de `value`). Va con borde y los
   * días del medio en gris suave.
   */
  rangeEdge?: string;
  onSelect: (iso: string) => void;
}

/** Los días del mes con huecos al inicio, para que el 1 caiga bajo su día de la semana. */
const daysOfMonth = (month: dayjs.Dayjs): (string | null)[] => {
  /* `day()` da 0 el domingo; con la semana desde el lunes, el domingo es la columna 7. */
  const leading = (month.startOf("month").day() + 6) % 7;
  const days = Array.from({ length: month.daysInMonth() }, (_, index) =>
    month.date(index + 1).format("YYYY-MM-DD"),
  );
  return [...Array.from({ length: leading }, () => null), ...days];
};

/**
 * Un mes de calendario, sobrio como el de Airbnb (Thony, 2026-11-06): el día elegido en un
 * círculo lleno del color del texto, el rango en gris suave y hoy subrayado. Sin colores de
 * marca: se lee más tranquilo. Se puede elegir cualquier día, también del pasado.
 */
export default function MonthCalendar({ value, rangeEdge, onSelect }: IMonthCalendarProps) {
  const [month, setMonth] = useState(() => dayjs(value).startOf("month"));
  const today = todayIso();
  const [rangeFrom, rangeTo] = rangeEdge ? [value, rangeEdge].sort() : [value, value];

  /* Si el día cambia por fuera (escrito a mano), el calendario va a su mes. */
  useEffect(() => {
    setMonth((current) => (dayjs(value).isSame(current, "month") ? current : dayjs(value).startOf("month")));
  }, [value]);

  return (
    <div className="w-full select-none">
      <div className="mb-2 flex items-center justify-between">
        <IconButton label="Mes anterior" size="sm" onClick={() => setMonth((current) => current.subtract(1, "month"))}>
          <ChevronLeft />
        </IconButton>
        <p className="font-heading font-semibold text-foreground capitalize" aria-live="polite">
          {month.format("MMMM YYYY")}
        </p>
        <IconButton label="Mes siguiente" size="sm" onClick={() => setMonth((current) => current.add(1, "month"))}>
          <ChevronRight />
        </IconButton>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((day, index) => (
          <span key={WEEKDAY_NAMES[index]} className="py-1.5" aria-hidden>
            {day}
          </span>
        ))}
      </div>

      <div role="grid" aria-label={month.format("MMMM YYYY")} className="grid grid-cols-7 gap-y-0.5">
        {daysOfMonth(month).map((iso, index) => {
          if (!iso) {
            return <span key={`empty-${index}`} />;
          }
          const isSelected = iso === value;
          const isEdge = iso === rangeEdge && !isSelected;
          const isInRange = iso > rangeFrom! && iso < rangeTo!;
          return (
            <div key={iso} className={cn("flex justify-center", isInRange && "bg-muted")}>
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={dayjs(iso).format("dddd D [de] MMMM")}
                onClick={() => onSelect(iso)}
                className={cn(
                  "flex size-9 cursor-pointer items-center justify-center rounded-full text-sm tabular-nums transition-colors",
                  isSelected
                    ? "bg-foreground font-semibold text-background"
                    : "text-foreground hover:ring-1 hover:ring-foreground",
                  isEdge && "ring-1 ring-foreground",
                  iso === today && !isSelected && "underline underline-offset-4",
                )}
              >
                {dayjs(iso).date()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
