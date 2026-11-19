import { IconButton } from "@juveco/ui/components/icon-button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import {
  EPaymentMethod,
  type IPaymentResource,
  type TPaymentMethod,
  paymentMethodLabels,
} from "@juveco/shared/activity-item-payments";
import { formatSoles } from "@juveco/shared/money";
import { fullName } from "@juveco/shared/people";
import { Banknote, type LucideIcon, Smartphone, Trash2 } from "lucide-react";

import { formatShortDate } from "@/common/utils/format-date";

const METHOD_ICON: Record<TPaymentMethod, LucideIcon> = {
  [EPaymentMethod.YAPE]: Smartphone,
  [EPaymentMethod.CASH]: Banknote,
};

interface IPaymentListProps<TPayment extends IPaymentResource> {
  payments: TPayment[];
  isLoading: boolean;
  onDelete: (payment: TPayment) => void;
}

/**
 * Los pagos de una cartilla o de la inscripción de un equipo, en el detalle: monto, cómo pagó,
 * cuándo y quién cobró. Cada uno se puede eliminar; no se editan.
 */
export default function PaymentList<TPayment extends IPaymentResource>({
  payments,
  isLoading,
  onDelete,
}: IPaymentListProps<TPayment>) {
  if (isLoading) {
    return (
      <div className="space-y-2 border-t border-border pt-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    );
  }

  if (payments.length === 0) {
    return <p className="border-t border-border pt-3 text-sm text-muted-foreground">Todavía no hay pagos.</p>;
  }

  return (
    <ul className="divide-y divide-border border-t border-border">
      {payments.map((payment) => {
        const MethodIcon = METHOD_ICON[payment.method];
        return (
          <li key={payment.id} className="flex items-center gap-3 py-2.5">
            <MethodIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground tabular-nums">
                {formatSoles(payment.amount)}
                <span className="font-normal text-muted-foreground"> · {paymentMethodLabels[payment.method]}</span>
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {formatShortDate(payment.createdAt)} · cobró {fullName(payment.collector)}
              </p>
            </div>
            <IconButton label="Eliminar pago" tone="destructive" isBordered onClick={() => onDelete(payment)}>
              <Trash2 />
            </IconButton>
          </li>
        );
      })}
    </ul>
  );
}
