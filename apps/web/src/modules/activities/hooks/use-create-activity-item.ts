import type { IActivityItemInput, IActivityItemResource } from "@juveco/shared/activity-items";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createActivityItemRequest } from "@/modules/activities/services/activity.service";

export const useCreateActivityItem = () => {
  const { loading, handleRequest } = useRequest<IActivityItemResource>();

  const handler = (activityId: string, payload: IActivityItemInput) =>
    handleRequest(async () => {
      const created = await createActivityItemRequest(activityId, payload);
      toast.success(`Serie «${created.serial}» agregada`);
      return created;
    });

  return { loading, handler };
};
