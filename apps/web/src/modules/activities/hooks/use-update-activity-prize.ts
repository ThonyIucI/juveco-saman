import type { IActivityPrizeInput, IActivityPrizeResource } from "@juveco/shared/activity-prizes";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { updateActivityPrizeRequest } from "@/modules/activities/services/activity-finance.service";

export const useUpdateActivityPrize = () => {
  const { loading, handleRequest } = useRequest<IActivityPrizeResource>();

  const handler = (prize: IActivityPrizeResource, payload: IActivityPrizeInput) =>
    handleRequest(async () => {
      const updated = await updateActivityPrizeRequest(prize, payload);
      toast.success(`Premio «${updated.name}» actualizado`);
      return updated;
    });

  return { loading, handler };
};
