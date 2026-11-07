import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type TUpdateActivityItemPayload,
  updateActivityItemRequest,
} from "@/modules/activities/services/activity.service";

export const useUpdateActivityItem = () => {
  const { loading, handleRequest } = useRequest<IActivityItemResource>();

  const handler = (item: IActivityItemResource, payload: TUpdateActivityItemPayload) =>
    handleRequest(async () => {
      const updated = await updateActivityItemRequest({ activityId: item.activityId, itemId: item.id, payload });
      toast.success(`Serie «${updated.serial}» actualizada`);
      return updated;
    });

  return { loading, handler };
};
