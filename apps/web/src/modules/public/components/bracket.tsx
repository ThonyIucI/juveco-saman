import { cn } from "@juveco/ui/lib/utils";
import { ArrowDown, Trophy } from "lucide-react";

import { formatWeekdayDate } from "@/common/utils/format-date";
import { BRACKET, MATCH_DAYS, findMatch, teamNameOf, winnerOf } from "@/modules/public/data/relampago-2026";
import { useElementWidth } from "@/modules/public/hooks/use-element-width";
import {
  BOX_HEIGHT,
  BOX_WIDTH,
  CHAMPION_WIDTH,
  CHIP_HEIGHT,
  LABEL_WIDTH,
  SLOT_HEIGHT,
  SLOT_WIDTH,
  layoutBracket,
} from "@/modules/public/utils/bracket-layout";

import BracketMatch from "./bracket-match";
import ChampionBox from "./champion-box";
import FinalSlots from "./final-slot";

const RESIZE_DEBOUNCE_MS = 100;
const TROPHY_BLOCK_WIDTH = 128;

/* Rótulos de ronda y sus fechas, sacados de los días del campeonato. */
const FIRST_ROUND_DATE = MATCH_DAYS[0]?.date ?? "";
const KNOCKOUT_DATE = MATCH_DAYS[1]?.date ?? "";
const ROUND_LABELS = {
  FIRST_ROUND: { title: "Fecha 1", date: FIRST_ROUND_DATE },
  SEMIFINAL: { title: "Semifinal", date: KNOCKOUT_DATE },
  FINAL: { title: "Final", date: KNOCKOUT_DATE },
} as const;

/** El campeón: el ganador de la final, cuando ya se jugó. */
const championOf = (): string | null => {
  const match = findMatch(BRACKET.finalId);
  const winner = match ? winnerOf(match) : null;
  return winner ? teamNameOf(winner) : null;
};

/** Rótulo de ronda: 12 px, mayúsculas, con su fecha debajo. */
function RoundLabel({ round }: { round: keyof typeof ROUND_LABELS }) {
  const { title, date } = ROUND_LABELS[round];
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-gold uppercase">{title}</p>
      <p className="text-xs text-white/80">{formatWeekdayDate(date)}</p>
    </div>
  );
}

/** La copa con «Final» y su fecha, sobre las casillas de la final. */
function TrophyHeader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <Trophy aria-hidden className="size-10 text-gold" strokeWidth={1.5} />
      <RoundLabel round="FINAL" />
    </div>
  );
}

/** Escritorio: el mapa simétrico, con las líneas dibujadas en un SVG bajo las cajas. */
function DesktopBracket() {
  const layout = layoutBracket();

  return (
    <div className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
      <svg aria-hidden width={layout.width} height={layout.height} className="pointer-events-none absolute inset-0">
        {layout.links.map((link) => (
          <path
            key={link.key}
            d={link.path}
            fill="none"
            strokeWidth={2}
            strokeDasharray={link.isBestLoser ? "5 4" : undefined}
            className={link.isReached ? "stroke-gold" : "stroke-white/35"}
          />
        ))}
      </svg>

      {layout.labels.map((label) => (
        <div key={`${label.key}-${label.x}`} className="absolute" style={{ left: label.x, top: label.y, width: LABEL_WIDTH }}>
          <RoundLabel round={label.key} />
        </div>
      ))}
      <div className="absolute top-0 w-32" style={{ left: layout.trophy.x - TROPHY_BLOCK_WIDTH / 2 }}>
        <TrophyHeader />
      </div>

      {layout.matches.map(({ match, x, y }) => (
        <div key={match.id} className="absolute" style={{ left: x, top: y, width: BOX_WIDTH, height: BOX_HEIGHT }}>
          <BracketMatch match={match} />
        </div>
      ))}
      {layout.chips.map((chip) => (
        <div
          key={chip.key}
          className="absolute flex items-center justify-center rounded-full border border-dashed border-gold/80 px-3 text-xs font-medium text-white"
          style={{ left: chip.x, top: chip.y, width: BOX_WIDTH, height: CHIP_HEIGHT }}
        >
          Mejor perdedor
        </div>
      ))}

      {layout.finalMatch && (
        <div
          className="absolute"
          style={{
            left: layout.slots.home.x,
            top: layout.slots.home.y,
            width: layout.slots.away.x + SLOT_WIDTH - layout.slots.home.x,
            height: SLOT_HEIGHT,
          }}
        >
          <FinalSlots match={layout.finalMatch} />
        </div>
      )}
      <div className="absolute" style={{ left: layout.champion.x, top: layout.champion.y, width: CHAMPION_WIDTH }}>
        <ChampionBox team={championOf()} />
      </div>
    </div>
  );
}

/** La línea que baja de una ronda a la siguiente, con una nota opcional. */
function Connector({ note }: { note?: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <span aria-hidden className="h-4 w-px bg-gold/70" />
      <ArrowDown aria-hidden className="size-4 text-gold" />
      {note && <p className="mt-1 text-center text-sm text-white/80">{note}</p>}
    </div>
  );
}

const matchOf = (id: string) => findMatch(id);

/** Celular y tablet: converge hacia abajo. Fecha 1, las dos semifinales, la final con la copa y el campeón. */
function StackedBracket() {
  const firstRound = [...BRACKET.left.feederIds, ...BRACKET.right.feederIds].flatMap((id) => matchOf(id) ?? []);
  const semifinals = [BRACKET.left.semifinalId, BRACKET.right.semifinalId].flatMap((id) => matchOf(id) ?? []);
  const finalMatch = matchOf(BRACKET.finalId);

  return (
    <div>
      <div className="mb-2">
        <RoundLabel round="FIRST_ROUND" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {firstRound.map((match) => (
          <BracketMatch key={match.id} match={match} />
        ))}
      </div>

      <Connector note={MATCH_DAYS[0]?.description} />
      <div className="mb-2">
        <RoundLabel round="SEMIFINAL" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {semifinals.map((match) => (
          <BracketMatch key={match.id} match={match} hasBestLoserCaption />
        ))}
      </div>

      <Connector />
      <TrophyHeader className="mb-3" />
      {finalMatch && <FinalSlots match={finalMatch} className="mx-auto max-w-sm" />}
      <Connector />
      <ChampionBox team={championOf()} className="mx-auto max-w-xs" />
    </div>
  );
}

/**
 * La llave del campeonato como un mapa de fase final (Thony, 2026-11-25): dos alas que convergen
 * en la final del centro, sobre azul marino con líneas doradas. El escritorio se dibuja cuando el
 * panel mide lo que la llave necesita; si no cabe, va en vertical. Las casillas sin equipo van
 * punteadas y se llenan solas con los resultados de `relampago-2026.ts`.
 */
export default function Bracket() {
  const { ref, width } = useElementWidth<HTMLDivElement>(RESIZE_DEBOUNCE_MS);
  const desktopWidth = layoutBracket().width;

  return (
    <section aria-label="Llave del campeonato" className="rounded-xl bg-[#14214A] p-4 text-white md:p-6">
      <div ref={ref}>
        {width !== null && (width >= desktopWidth ? <DesktopBracket /> : <StackedBracket />)}
      </div>
    </section>
  );
}
