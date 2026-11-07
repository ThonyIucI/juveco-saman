import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteActivityItemRequest } from "@/modules/activities/services/activity.service";

export const useDeleteActivityItem = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (item: IActivityItemResource) =>
    handleRequest(async () => {
      const deleted = await deleteActivityItemRequest(item.activityId, item.id);
      toast.success(`Serie «${item.serial}» eliminada`);
      return deleted;
    });

  return { loading, handler };
};
