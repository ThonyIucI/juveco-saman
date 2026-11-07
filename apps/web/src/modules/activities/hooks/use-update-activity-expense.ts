import type { IActivityExpenseInput, IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { updateActivityExpenseRequest } from "@/modules/activities/services/activity-finance.service";

export const useUpdateActivityExpense = () => {
  const { loading, handleRequest } = useRequest<IActivityExpenseResource>();

  const handler = (expense: IActivityExpenseResource, payload: IActivityExpenseInput) =>
    handleRequest(async () => {
      const updated = await updateActivityExpenseRequest(expense, payload);
      toast.success(`Gasto «${updated.concept}» actualizado`);
      return updated;
    });

  return { loading, handler };
};
