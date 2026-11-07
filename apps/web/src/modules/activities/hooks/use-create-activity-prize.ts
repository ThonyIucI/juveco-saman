import type { IActivityPrizeInput, IActivityPrizeResource } from "@juveco/shared/activity-prizes";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createActivityPrizeRequest } from "@/modules/activities/services/activity-finance.service";

export const useCreateActivityPrize = () => {
  const { loading, handleRequest } = useRequest<IActivityPrizeResource>();

  const handler = (activityId: string, payload: IActivityPrizeInput) =>
    handleRequest(async () => {
      const created = await createActivityPrizeRequest(activityId, payload);
      toast.success(`Premio «${created.name}» agregado`);
      return created;
    });

  return { loading, handler };
};
