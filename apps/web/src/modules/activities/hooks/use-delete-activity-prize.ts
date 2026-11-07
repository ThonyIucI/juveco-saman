import type { IActivityPrizeResource } from "@juveco/shared/activity-prizes";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteActivityPrizeRequest } from "@/modules/activities/services/activity-finance.service";

export const useDeleteActivityPrize = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (prize: IActivityPrizeResource) =>
    handleRequest(async () => {
      const deleted = await deleteActivityPrizeRequest(prize);
      toast.success(`Premio «${prize.name}» eliminado`);
      return deleted;
    });

  return { loading, handler };
};
