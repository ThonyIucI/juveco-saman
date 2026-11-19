import type { IActivityTeamPaymentResource, IActivityTeamResource } from "@juveco/shared/activity-teams";
import { formatSoles } from "@juveco/shared/money";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { type TTeamPaymentChange, deleteTeamPaymentRequest } from "@/modules/activities/services/activity-team.service";

export const useDeleteTeamPayment = () => {
  const { loading, handleRequest } = useRequest<TTeamPaymentChange>();

  const handler = (team: IActivityTeamResource, payment: IActivityTeamPaymentResource) =>
    handleRequest(async () => {
      const change = await deleteTeamPaymentRequest(team.activityId, team.id, payment.id);
      toast.success(`Pago de ${formatSoles(payment.amount)} eliminado`);
      return change;
    });

  return { loading, handler };
};
