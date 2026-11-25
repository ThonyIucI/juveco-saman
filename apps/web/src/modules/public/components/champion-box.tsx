import { cn } from "@juveco/ui/lib/utils";
import { Trophy } from "lucide-react";

import { shortTeamName } from "./bracket-match";

/** La casilla del campeón: punteada y vacía hasta que se juegue la final; luego, dorada con su nombre. */
export default function ChampionBox({ team, className }: { team: string | null; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-16 flex-col items-center justify-center rounded-xl px-2 text-center",
        team ? "bg-gold text-gold-foreground" : "border border-dashed border-gold/80 text-white/80",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <Trophy aria-hidden className="size-4" />
        Campeón
      </p>
      {team && <p className="max-w-full truncate text-sm font-semibold">{shortTeamName(team)}</p>}
    </div>
  );
}
