import { useEffect, useState } from "react";

import { useFindPersonMatches } from "@/modules/users/hooks/use-find-person-matches";
import { looksLikeDocumentNumber } from "@/modules/users/utils/user-search";

const LOOKUP_DEBOUNCE_MS = 300;

/**
 * Los buscadores de personas filtran la lista cargada, y esa lista no trae el DNI. Si lo
 * escrito es un DNI completo, se le pregunta al servidor y se devuelven los ids que coinciden.
 */
export const useDocumentUserIds = (term: string): string[] => {
  const FindByDocument = useFindPersonMatches();
  const [ids, setIds] = useState<string[]>([]);
  const documentNumber = term.trim();
  const isDocument = looksLikeDocumentNumber(documentNumber);

  useEffect(() => {
    if (!isDocument) {
      setIds([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const found = await FindByDocument.handler({ documentNumber }, controller.signal);
      if (!controller.signal.aborted && found) {
        setIds(found.map((match) => match.id));
      }
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDocument, documentNumber]);

  return ids;
};
