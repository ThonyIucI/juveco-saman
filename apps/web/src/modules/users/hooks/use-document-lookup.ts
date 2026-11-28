import { type IDocumentLookupResource, isValidDocumentNumber } from "@juveco/shared/user-profiles";
import { useEffect, useState } from "react";

import { lookupDocumentRequest } from "@/modules/users/services/user.service";

/* La misma espera que la búsqueda de repetidos: se consulta al dejar de escribir. */
const LOOKUP_DEBOUNCE_MS = 400;

/**
 * Autocompletar con el DNI: al completar los 8 dígitos (y dejar de escribir 400 ms) consulta
 * RENIEC a través del servidor, que usa el servicio de identificación de id-pos. Sin
 * `isEnabled` (p. ej. la persona ya está registrada) no consulta. Si falla o no lo encuentra,
 * devuelve `null` y se sigue a mano: nunca muestra error.
 */
export const useDocumentLookup = (documentNumber: string, isEnabled: boolean) => {
  const [result, setResult] = useState<IDocumentLookupResource | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const trimmed = documentNumber.trim();
  const isComplete = isValidDocumentNumber(trimmed);

  useEffect(() => {
    setResult(null);
    if (!isEnabled || !isComplete) {
      setIsLooking(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLooking(true);
      try {
        const found = await lookupDocumentRequest(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          setResult(found);
        }
      } catch {
        /* Sin consulta, se escribe a mano. */
      } finally {
        if (!controller.signal.aborted) {
          setIsLooking(false);
        }
      }
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, isComplete, isEnabled]);

  return { result, isLooking };
};
