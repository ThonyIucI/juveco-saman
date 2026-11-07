import type { IActivityExpenseInput, IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createActivityExpenseRequest } from "@/modules/activities/services/activity-finance.service";

export const useCreateActivityExpense = () => {
  const { loading, handleRequest } = useRequest<IActivityExpenseResource>();

  const handler = (activityId: string, payload: IActivityExpenseInput) =>
    handleRequest(async () => {
      const created = await createActivityExpenseRequest(activityId, payload);
      toast.success(`Gasto «${created.concept}» agregado`);
      return created;
    });

  return { loading, handler };
};
