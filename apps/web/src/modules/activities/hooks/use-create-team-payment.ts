import type { IActivityItemPaymentInput } from "@juveco/shared/activity-item-payments";
import type { IActivityTeamResource } from "@juveco/shared/activity-teams";
import { formatSoles } from "@juveco/shared/money";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { type TTeamPaymentChange, createTeamPaymentRequest } from "@/modules/activities/services/activity-team.service";

export const useCreateTeamPayment = () => {
  const { loading, handleRequest } = useRequest<TTeamPaymentChange>();

  const handler = (team: IActivityTeamResource, payload: IActivityItemPaymentInput) =>
    handleRequest(async () => {
      const change = await createTeamPaymentRequest(team.activityId, team.id, payload);
      toast.success(`Pago de ${formatSoles(change.payment.amount)} registrado para «${team.name}»`);
      return change;
    });

  return { loading, handler };
};
