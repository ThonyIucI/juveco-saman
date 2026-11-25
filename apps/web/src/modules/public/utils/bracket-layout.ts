import { BRACKET, type IBracketWing, type IMatch, type IMatchSide, findMatch, loserOf, winnerOf } from "@/modules/public/data/relampago-2026";

/* Medidas del mapa de fase final en escritorio, en px. Cada partido son dos filas de 36. */
export const BOX_WIDTH = 156;
export const ROW_HEIGHT = 36;
export const BOX_HEIGHT = ROW_HEIGHT * 2;
export const SLOT_WIDTH = 132;
export const SLOT_HEIGHT = 56;
export const CHAMPION_WIDTH = 160;
export const CHAMPION_HEIGHT = 64;
export const CHIP_HEIGHT = 36;
export const LABEL_WIDTH = BOX_WIDTH;

const COLUMN_GAP = 36;
const BOX_GAP = 24;
const SLOT_GAP = 16;
const CENTER_WIDTH = SLOT_WIDTH * 2 + SLOT_GAP;
const FEEDER_TOP = 72;
const LABEL_OFFSET = 34;
const CHAMPION_DROP = 40;

export interface IPlacedMatch {
  match: IMatch;
  x: number;
  y: number;
}

export interface IPlacedChip {
  key: string;
  x: number;
  y: number;
}

export interface IPlacedLabel {
  key: "FIRST_ROUND" | "SEMIFINAL" | "FINAL";
  x: number;
  y: number;
}

export interface IBracketLink {
  key: string;
  /** Trazo en ángulos rectos de la casilla de origen a la de destino. */
  path: string;
  /** El equipo ya llegó: la línea va resaltada. */
  isReached: boolean;
  /** Viene del mejor perdedor: va punteada. */
  isBestLoser: boolean;
}

export interface IBracketLayout {
  matches: IPlacedMatch[];
  chips: IPlacedChip[];
  labels: IPlacedLabel[];
  /** Casilla de la final de cada lado: la izquierda es la local. */
  slots: { home: { x: number; y: number }; away: { x: number; y: number } };
  finalMatch: IMatch | null;
  trophy: { x: number };
  champion: { x: number; y: number };
  links: IBracketLink[];
  width: number;
  height: number;
}

const elbow = (x1: number, y1: number, x2: number, y2: number): string => {
  const middle = (x1 + x2) / 2;
  return `M ${x1} ${y1} H ${middle} V ${y2} H ${x2}`;
};

/** La fila (0 local, 1 visita) del equipo que pasó de ese partido; `null` si aún no se sabe. */
const advancingRow = (match: IMatch, outcome: "WINNER" | "BEST_LOSER"): number | null => {
  const side: IMatchSide | null = outcome === "WINNER" ? winnerOf(match) : loserOf(match);
  if (!side) {
    return null;
  }
  return side === match.home ? 0 : 1;
};

const rowCenterY = (box: { y: number }, row: number | null): number =>
  box.y + (row === null ? BOX_HEIGHT / 2 : ROW_HEIGHT * (row + 0.5));

interface IWingResult {
  matches: IPlacedMatch[];
  chips: IPlacedChip[];
  links: IBracketLink[];
  semifinal: IPlacedMatch | null;
}

/** Un ala: sus partidos de la fecha 1 al borde, la semifinal hacia el centro. `isLeft` la espeja. */
const layoutWing = (wing: IBracketWing, isLeft: boolean, centerX: number): IWingResult => {
  const semifinalMatch = findMatch(wing.semifinalId);
  if (!semifinalMatch) {
    return { matches: [], chips: [], links: [], semifinal: null };
  }
  const feederX = isLeft ? 0 : centerX + CENTER_WIDTH + COLUMN_GAP + BOX_WIDTH + COLUMN_GAP;
  const semifinalX = isLeft ? BOX_WIDTH + COLUMN_GAP : centerX + CENTER_WIDTH + COLUMN_GAP;
  const semifinal: IPlacedMatch = {
    match: semifinalMatch,
    x: semifinalX,
    y: FEEDER_TOP + (BOX_HEIGHT + BOX_GAP) / 2,
  };

  const matches: IPlacedMatch[] = [semifinal];
  const chips: IPlacedChip[] = [];
  const links: IBracketLink[] = [];

  [semifinalMatch.home, semifinalMatch.away].forEach((side, row) => {
    const source = side.source;
    const originMatch = source ? findMatch(source.matchId) : null;
    if (!source || !originMatch) {
      return;
    }
    const itemY = FEEDER_TOP + row * (BOX_HEIGHT + BOX_GAP);
    const startX = isLeft ? feederX + BOX_WIDTH : feederX;
    const endX = isLeft ? semifinalX : semifinalX + BOX_WIDTH;
    const endY = rowCenterY(semifinal, row);
    const advancing = advancingRow(originMatch, source.outcome);

    if (wing.feederIds.includes(source.matchId)) {
      const placed = { match: originMatch, x: feederX, y: itemY };
      matches.push(placed);
      links.push({
        key: `${originMatch.id}-${semifinalMatch.id}-${row}`,
        path: elbow(startX, rowCenterY(placed, advancing), endX, endY),
        isReached: advancing !== null,
        isBestLoser: false,
      });
      return;
    }
    /* Viene del otro lado de la llave: una etiqueta «Mejor perdedor» y su línea punteada. */
    const chip = { key: `${originMatch.id}-${row}`, x: feederX, y: itemY + (BOX_HEIGHT - CHIP_HEIGHT) / 2 };
    chips.push(chip);
    links.push({
      key: `${chip.key}-chip`,
      path: elbow(startX, chip.y + CHIP_HEIGHT / 2, endX, endY),
      isReached: advancing !== null,
      isBestLoser: source.outcome === "BEST_LOSER",
    });
  });

  return { matches, chips, links, semifinal };
};

/**
 * Pone la llave como un mapa de fase final simétrico que converge al centro: copa y final arriba,
 * las dos casillas de la final una al lado de la otra y el campeón debajo. Cada ala lleva sus
 * partidos de la fecha 1 afuera y su semifinal hacia el centro; las líneas parten de la fila del
 * equipo que pasó (o del centro del partido si aún no se juega).
 */
export const layoutBracket = (): IBracketLayout => {
  const centerX = (BOX_WIDTH + COLUMN_GAP) * 2;
  const left = layoutWing(BRACKET.left, true, centerX);
  const right = layoutWing(BRACKET.right, false, centerX);
  const finalMatch = findMatch(BRACKET.finalId);

  const semifinalCenterY = FEEDER_TOP + (BOX_HEIGHT + BOX_GAP) / 2 + ROW_HEIGHT;
  const slotY = semifinalCenterY - SLOT_HEIGHT / 2;
  const homeSlot = { x: centerX, y: slotY };
  const awaySlot = { x: centerX + SLOT_WIDTH + SLOT_GAP, y: slotY };
  const champion = {
    x: centerX + (CENTER_WIDTH - CHAMPION_WIDTH) / 2,
    y: slotY + SLOT_HEIGHT + CHAMPION_DROP,
  };

  const links = [...left.links, ...right.links];
  if (left.semifinal) {
    links.push({
      key: "semifinal-left-final",
      path: `M ${left.semifinal.x + BOX_WIDTH} ${semifinalCenterY} H ${homeSlot.x}`,
      isReached: winnerOf(left.semifinal.match) !== null,
      isBestLoser: false,
    });
  }
  if (right.semifinal) {
    links.push({
      key: "semifinal-right-final",
      path: `M ${right.semifinal.x} ${semifinalCenterY} H ${awaySlot.x + SLOT_WIDTH}`,
      isReached: winnerOf(right.semifinal.match) !== null,
      isBestLoser: false,
    });
  }

  const winner = finalMatch ? winnerOf(finalMatch) : null;
  const dropY = slotY + SLOT_HEIGHT + CHAMPION_DROP / 2;
  const championCenterX = champion.x + CHAMPION_WIDTH / 2;
  (
    [
      { key: "home", slot: homeSlot, side: finalMatch?.home },
      { key: "away", slot: awaySlot, side: finalMatch?.away },
    ] as const
  ).forEach(({ key, slot, side }) => {
    links.push({
      key: `final-${key}-champion`,
      path: `M ${slot.x + SLOT_WIDTH / 2} ${slotY + SLOT_HEIGHT} V ${dropY} H ${championCenterX} V ${champion.y}`,
      isReached: winner !== null && winner === side,
      isBestLoser: false,
    });
  });

  return {
    matches: [...left.matches, ...right.matches],
    chips: [...left.chips, ...right.chips],
    labels: [
      { key: "FIRST_ROUND", x: 0, y: FEEDER_TOP - LABEL_OFFSET },
      { key: "FIRST_ROUND", x: centerX + CENTER_WIDTH + COLUMN_GAP + BOX_WIDTH + COLUMN_GAP, y: FEEDER_TOP - LABEL_OFFSET },
      { key: "SEMIFINAL", x: BOX_WIDTH + COLUMN_GAP, y: left.semifinal ? left.semifinal.y - LABEL_OFFSET : 0 },
      { key: "SEMIFINAL", x: centerX + CENTER_WIDTH + COLUMN_GAP, y: right.semifinal ? right.semifinal.y - LABEL_OFFSET : 0 },
    ],
    slots: { home: homeSlot, away: awaySlot },
    finalMatch,
    trophy: { x: centerX + CENTER_WIDTH / 2 },
    champion,
    links,
    width: centerX + CENTER_WIDTH + (COLUMN_GAP + BOX_WIDTH) * 2,
    height: champion.y + CHAMPION_HEIGHT + 4,
  };
};
