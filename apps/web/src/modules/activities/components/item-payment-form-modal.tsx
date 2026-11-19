import type { IPaymentChange } from "@juveco/shared/activity-item-payments";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { fullName } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";

import { useCreateItemPayment } from "@/modules/activities/hooks/use-create-item-payment";
import { collectionOf } from "@/modules/activities/utils/activity-items";

import PaymentFormModal from "./payment-form-modal";

interface IItemPaymentFormModalProps {
  /** El ítem a cobrar; `null` cierra la modal. */
  item: IActivityItemResource | null;
  /** El admin de la sesión: viene puesto en «Cobrado por». */
  currentUserId: string;
  /** Las personas: de ahí salen los administradores que pueden cobrar. */
  users: IUserResource[];
  onSaved: (change: IPaymentChange<IActivityItemResource>) => void;
  onClose: () => void;
}

/** Registrar un pago de un ítem (en un bingo, una cartilla), con el formulario común de pagos. */
export default function ItemPaymentFormModal({
  item,
  currentUserId,
  users,
  onSaved,
  onClose,
}: IItemPaymentFormModalProps) {
  const CreateItemPayment = useCreateItemPayment();

  return (
    <PaymentFormModal
      open={item !== null}
      subtitle={item ? `N.º ${item.serial} · ${fullName(item.buyer)}` : undefined}
      pending={item ? collectionOf(item).pending : 0}
      currentUserId={currentUserId}
      users={users}
      onSubmit={async (payload) => {
        if (!item) {
          return false;
        }
        const change = await CreateItemPayment.handler(item, payload);
        if (change) {
          onSaved(change);
        }
        return change !== null;
      }}
      onClose={onClose}
    />
  );
}
