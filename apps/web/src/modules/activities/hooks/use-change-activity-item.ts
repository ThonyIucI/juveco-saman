import type { IActivityItemChangeResult, IActivityItemResource } from "@juveco/shared/activity-items";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { changeActivityItemRequest } from "@/modules/activities/services/activity.service";

/** Cambio de cartilla (Thony, 2026-11-11): anula la perdida y entrega otra con la serie nueva. */
export const useChangeActivityItem = () => {
  const { loading, handleRequest } = useRequest<IActivityItemChangeResult>();

  const handler = (item: IActivityItemResource, serial: string) =>
    handleRequest(async () => {
      const result = await changeActivityItemRequest(item.activityId, item.id, { serial });
      toast.success(`Serie «${item.serial}» anulada: ahora es la «${result.replacement.serial}»`);
      return result;
    });

  return { loading, handler };
};
