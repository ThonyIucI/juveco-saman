import { Badge } from "@juveco/ui/components/badge";
import { Button } from "@juveco/ui/components/button";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import type { IActivityPrizeResource } from "@juveco/shared/activity-prizes";
import { fullName } from "@juveco/shared/people";
import { Ticket, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import Modal from "@/common/components/modal";
import SearchInput from "@/common/components/search-input";
import { compareBySerial, matchesActivityItemSearch } from "@/modules/activities/utils/activity-items";

/* Con la serie casi completa ya quedan pocas: no hace falta mostrar más. */
const MAX_RESULTS = 8;

interface IPrizeWinnerModalProps {
  /** `null`: cerrado. */
  prize: IActivityPrizeResource | null;
  items: IActivityItemResource[];
  isSaving: boolean;
  /** Devuelve si se guardó; con `null` se quita el ganador. */
  onPick: (prize: IActivityPrizeResource, itemId: string | null) => Promise<boolean>;
  onClose: () => void;
}

/**
 * Marcar al ganador de un premio en vivo, durante el sorteo (acordado 2026-11-25): se escribe
 * la serie cantada (o el nombre) y se toca la cartilla. El ganador es su comprador.
 */
export default function PrizeWinnerModal({ prize, items, isSaving, onPick, onClose }: IPrizeWinnerModalProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (prize) {
      setSearch("");
    }
  }, [prize]);

  const term = search.trim().toLowerCase();
  const results = term
    ? items
        .filter((item) => matchesActivityItemSearch(item, term))
        .sort(compareBySerial)
        .slice(0, MAX_RESULTS)
    : [];

  const pick = async (itemId: string | null) => {
    if (prize && (await onPick(prize, itemId))) {
      onClose();
    }
  };

  return (
    <Modal open={prize !== null} title="Ganador del premio" subtitle={prize?.name} width="lg" onClose={onClose}>
      <div className="space-y-4">
        {prize?.winner && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <Trophy aria-hidden className="size-5 shrink-0 text-gold-ink" />
            <p className="min-w-0 flex-1 truncate">
              <span className="font-mono font-semibold">{prize.winner.serial}</span>
              {" · "}
              {fullName(prize.winner.buyer)}
            </p>
            <Button type="button" size="sm" variant="outline" disabled={isSaving} onClick={() => pick(null)}>
              Quitar
            </Button>
          </div>
        )}

        <SearchInput
          isCompact
          icon={Ticket}
          autoFocus
          inputMode="search"
          placeholder="Ingresa la serie o el nombre"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {term && results.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">No hay cartillas con «{search.trim()}».</p>
        )}

        {results.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => pick(item.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
                >
                  <span className="w-14 shrink-0 font-mono font-semibold tabular-nums">{item.serial}</span>
                  <span className="min-w-0 flex-1 truncate">{fullName(item.buyer)}</span>
                  {item.voidedAt && (
                    <Badge color="neutral" className="shrink-0 rounded-md">
                      Anulada
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
