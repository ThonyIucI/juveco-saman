import { cn } from "@juveco/ui/lib/utils";
import dayjs from "dayjs";

interface IDateBlockProps {
  /** «2026-11-28». */
  date: string;
  /** Sobre fondo azul marino el mes va en dorado. */
  isOnNavy?: boolean;
  className?: string;
}

/** La fecha como una hoja de calendario: el mes arriba, el día grande. */
export default function DateBlock({ date, isOnNavy = false, className }: IDateBlockProps) {
  const day = dayjs(date);

  return (
    <time
      dateTime={date}
      className={cn(
        "flex w-14 shrink-0 flex-col overflow-hidden rounded-lg border text-center",
        isOnNavy ? "border-white/20 bg-white text-[#14214A]" : "border-border bg-card text-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "py-0.5 text-xs font-semibold tracking-wide uppercase",
          isOnNavy ? "bg-gold text-gold-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        {day.format("MMM")}
      </span>
      <span className="py-1 font-heading text-2xl leading-none font-semibold tabular-nums">{day.format("D")}</span>
    </time>
  );
}
