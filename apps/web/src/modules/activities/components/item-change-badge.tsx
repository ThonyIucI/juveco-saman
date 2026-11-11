import { Badge } from "@juveco/ui/components/badge";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { Ban, Repeat } from "lucide-react";

interface IItemChangeBadgeProps {
  item: IActivityItemResource;
  /** La serie del otro lado del cambio (ver `changedSerials`); sin cambio, `undefined`. */
  relatedSerial: string | undefined;
}

/**
 * El lugar de «Por cobrar» en las pagadas y las anuladas (Thony, 2026-11-11), donde ese
 * monto no dice nada: si salió de un cambio de cartilla, de cuál; si se anuló, por cuál se
 * cambió. Sin cambio, una raya.
 */
export default function ItemChangeBadge({ item, relatedSerial }: IItemChangeBadgeProps) {
  if (item.voidedAt) {
    return (
      <Badge color="destructive" className="rounded-md tabular-nums">
        <Ban aria-hidden />
        {/* «Cambió a» y no «Cambiada por»: más corto (Thony, 2026-11-11). */}
        {relatedSerial ? `Cambió a ${relatedSerial}` : "Anulada"}
      </Badge>
    );
  }

  if (relatedSerial) {
    return (
      <Badge color="neutral" className="rounded-md tabular-nums">
        <Repeat aria-hidden />
        Cambio de {relatedSerial}
      </Badge>
    );
  }

  return (
    <span aria-label="Sin cambio" className="text-sm text-muted-foreground">
      —
    </span>
  );
}
