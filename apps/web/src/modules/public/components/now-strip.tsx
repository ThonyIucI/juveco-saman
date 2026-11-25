import type { IPublicProject } from "@juveco/shared/public";
import dayjs from "dayjs";
import { ArrowRight, CalendarHeart } from "lucide-react";

import { formatLongDate } from "@/common/utils/format-date";
import { scrollToSection } from "@/modules/public/utils/scroll";

/** «faltan 28 días», «es mañana», «es hoy»; nada si ya pasó. */
const countdownOf = (date: string): string | null => {
  const days = dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");
  if (days < 0) {
    return null;
  }
  if (days === 0) {
    return "es hoy";
  }
  return days === 1 ? "es mañana" : `faltan ${days} días`;
};

/** La franja «Ahora» bajo el carrusel: el evento en curso, cuándo es y cuánto falta. */
export default function NowStrip({ event }: { event: IPublicProject }) {
  const countdown = countdownOf(event.startDate);

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 md:px-6">
        <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-bold tracking-widest uppercase">Ahora</span>
        <p className="flex min-w-0 items-center gap-2 font-semibold">
          <CalendarHeart aria-hidden className="size-5 shrink-0 text-gold" />
          <span>
            {event.name} · {formatLongDate(event.startDate)}
            {event.beneficiaryCount ? ` · ${event.beneficiaryCount} niños` : ""}
            {countdown && <span className="text-gold"> · {countdown}</span>}
          </span>
        </p>
        <button
          type="button"
          onClick={() => scrollToSection("eventos")}
          className="ml-auto flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-bold hover:underline"
        >
          Ver más
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
