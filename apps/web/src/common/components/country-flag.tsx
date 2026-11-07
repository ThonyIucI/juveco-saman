import { cn } from "@juveco/ui/lib/utils";
import * as flags from "country-flag-icons/react/3x2";
import type { CountryCode } from "libphonenumber-js";

interface ICountryFlagProps {
  country: CountryCode;
  className?: string;
}

/** Bandera SVG (como en id-pos): los emojis de bandera no se ven en Windows. */
export default function CountryFlag({ country, className }: ICountryFlagProps) {
  const Flag = flags[country as keyof typeof flags];

  if (!Flag) {
    return <span className={cn("text-xs font-semibold text-muted-foreground", className)}>{country}</span>;
  }

  return <Flag aria-hidden className={cn("h-3.5 w-5 shrink-0 rounded-[2px] shadow-xs", className)} />;
}
