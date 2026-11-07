import { isIsoDate } from "@juveco/shared/dates";
import { cn } from "@juveco/ui/lib/utils";
import dayjs from "dayjs";
import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

import MonthCalendar from "@/common/components/month-calendar";

/** «05/11/2026» → «2026-11-05»; `null` si no es una fecha real. */
export const parseWrittenDate = (text: string): string | null => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  const iso = `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
  return isIsoDate(iso) ? iso : null;
};

const toWrittenDate = (iso: string): string => dayjs(iso).format("DD/MM/YYYY");

/* Con menos caracteres todavía se está escribiendo: no se marca error. */
const MIN_COMPLETE_LENGTH = 8;

interface IDateInputProps {
  /** «2026-11-05». */
  value: string;
  onChange: (iso: string) => void;
  /** Valida la fecha ya completa; devuelve el error en español o `null`. */
  validate?: (iso: string) => string | null;
  /** El otro extremo de un rango, para sombrearlo en el calendario. */
  rangeEdge?: string;
  label: string;
}

/**
 * Una fecha que **se escribe o se elige** (Thony, 2026-11-06): el campo con el ícono de
 * calendario, con el mismo estilo que el del periodo, y el calendario debajo. Escribir
 * mueve el calendario; tocar un día llena el campo.
 */
export default function DateInput({ value, onChange, validate, rangeEdge, label }: IDateInputProps) {
  const [text, setText] = useState(() => toWrittenDate(value));
  const [error, setError] = useState<string | null>(null);

  /* Si la fecha cambia por fuera (o desde el calendario), el texto la sigue. */
  useEffect(() => {
    setText((current) => (parseWrittenDate(current) === value ? current : toWrittenDate(value)));
  }, [value]);

  const commit = (iso: string): boolean => {
    const problem = validate?.(iso) ?? null;
    setError(problem);
    if (!problem) {
      onChange(iso);
    }
    return !problem;
  };

  const handleTextChange = (next: string) => {
    setText(next);
    const iso = parseWrittenDate(next);
    if (!iso) {
      setError(next.trim().length >= MIN_COMPLETE_LENGTH ? "Escribe la fecha como 05/12/2026." : null);
      return;
    }
    commit(iso);
  };

  const handleDaySelect = (iso: string) => {
    if (commit(iso)) {
      setText(toWrittenDate(iso));
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label
          className={cn(
            "flex h-11 w-full items-center gap-2.5 rounded-xl border bg-card px-3.5 text-sm text-foreground transition-colors focus-within:ring-4 focus-within:ring-ring/30",
            error ? "border-destructive" : "border-border focus-within:border-foreground/40",
          )}
        >
          <CalendarDays className="size-4.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="sr-only">{label}</span>
          <input
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            aria-invalid={error !== null}
            value={text}
            onChange={(event) => handleTextChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base tabular-nums outline-none placeholder:text-muted-foreground md:text-sm"
          />
        </label>
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>
      <MonthCalendar value={value} rangeEdge={rangeEdge} onSelect={handleDaySelect} />
    </div>
  );
}
