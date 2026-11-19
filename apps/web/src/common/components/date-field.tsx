import { Popover, PopoverContent, PopoverTrigger } from "@juveco/ui/components/popover";
import { cn } from "@juveco/ui/lib/utils";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";

import MonthCalendar from "@/common/components/month-calendar";
import { formatShortDate } from "@/common/utils/format-date";

interface IDateFieldProps {
  id: string;
  /** «2026-11-21»; vacío = sin fecha. */
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  /** Dónde abre el calendario si todavía no hay fecha (p. ej. el inicio para el fin). */
  fallbackMonth: string;
  /** El otro extremo de un rango, para sombrearlo en el calendario. */
  rangeEdge?: string;
  /** Si es opcional: una X para dejarla vacía. */
  onClear?: () => void;
  isInvalid?: boolean;
}

/**
 * Una fecha suelta en un formulario (Thony, 2026-11-17): se ve como un campo más y el
 * calendario se abre en un popover al tocarlo, como en Yiya. Elegir un día lo cierra.
 */
export default function DateField({
  id,
  value,
  onChange,
  placeholder = "Elige una fecha",
  fallbackMonth,
  rangeEdge,
  onClear,
  isInvalid = false,
}: IDateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <button
              id={id}
              type="button"
              aria-invalid={isInvalid}
              className={cn(
                "flex h-control w-full cursor-pointer items-center gap-2.5 rounded-lg border bg-field px-4 text-left text-sm font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/30",
                isInvalid ? "border-destructive ring-4 ring-destructive/20" : "border-field-border hover:border-primary/50",
                onClear && value && "pr-11",
              )}
            />
          }
        >
          <CalendarDays aria-hidden className="size-4.5 shrink-0 text-muted-foreground" />
          <span className={cn("min-w-0 flex-1 truncate tabular-nums", !value && "font-normal text-placeholder")}>
            {value ? formatShortDate(value) : placeholder}
          </span>
        </PopoverTrigger>

        <PopoverContent className="w-[min(22rem,calc(100vw-2rem))]">
          <MonthCalendar
            value={value || fallbackMonth}
            rangeEdge={rangeEdge}
            onSelect={(iso) => {
              onChange(iso);
              setIsOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {onClear && value && (
        <button
          type="button"
          aria-label="Quitar la fecha"
          onClick={onClear}
          className="absolute inset-y-0 right-2 my-auto flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
