import type { IActivityItemPaymentResource, IPaymentChange } from "@juveco/shared/activity-item-payments";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { formatSoles } from "@juveco/shared/money";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteItemPaymentRequest } from "@/modules/activities/services/activity.service";

export const useDeleteItemPayment = () => {
  const { loading, handleRequest } = useRequest<IPaymentChange<IActivityItemResource>>();

  const handler = (item: IActivityItemResource, payment: IActivityItemPaymentResource) =>
    handleRequest(async () => {
      const change = await deleteItemPaymentRequest(item.activityId, item.id, payment.id);
      toast.success(`Pago de ${formatSoles(payment.amount)} eliminado`);
      return change;
    });

  return { loading, handler };
};
