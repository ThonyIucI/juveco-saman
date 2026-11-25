import type { IActivityPrizeResource } from "@juveco/shared/activity-prizes";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { setPrizeWinnerRequest } from "@/modules/activities/services/activity-finance.service";

/** Marca la cartilla ganadora de un premio; con `null` la quita. */
export const useSetPrizeWinner = () => {
  const { loading, handleRequest } = useRequest<IActivityPrizeResource>();

  const handler = (prize: IActivityPrizeResource, itemId: string | null) =>
    handleRequest(async () => {
      const updated = await setPrizeWinnerRequest(prize, { itemId });
      toast.success(itemId ? `Ganador de «${prize.name}» registrado` : `Ganador de «${prize.name}» quitado`);
      return updated;
    });

  return { loading, handler };
};
