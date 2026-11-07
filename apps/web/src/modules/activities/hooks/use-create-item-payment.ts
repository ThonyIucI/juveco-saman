import type { IActivityItemPaymentInput, IPaymentChange } from "@juveco/shared/activity-item-payments";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { formatSoles } from "@juveco/shared/money";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createItemPaymentRequest } from "@/modules/activities/services/activity.service";

export const useCreateItemPayment = () => {
  const { loading, handleRequest } = useRequest<IPaymentChange<IActivityItemResource>>();

  const handler = (item: IActivityItemResource, payload: IActivityItemPaymentInput) =>
    handleRequest(async () => {
      const change = await createItemPaymentRequest(item.activityId, item.id, payload);
      toast.success(`Pago de ${formatSoles(change.payment.amount)} registrado en la serie «${item.serial}»`);
      return change;
    });

  return { loading, handler };
};
