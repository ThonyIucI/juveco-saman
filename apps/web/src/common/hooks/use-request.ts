import { useCallback, useState } from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";

interface IUseRequestResult<TData> {
  data: TData | null;
  loading: boolean;
  /** Ejecuta la petición; devuelve `null` si falló (el error ya se mostró en un toast). */
  handleRequest: (run: () => Promise<TData>) => Promise<TData | null>;
  setData: (update: (previous: TData | null) => TData | null) => void;
}

/**
 * Estado de una petición: loading, data y el toast de error en un solo sitio.
 * Deliberadamente casero en vez de TanStack Query: no agrega dependencias ni provider,
 * que es lo que necesitamos para la primera clase. Migrar cuando haya caché que compartir.
 */
export const useRequest = <TData>(initialData: TData | null = null): IUseRequestResult<TData> => {
  const [data, setDataState] = useState<TData | null>(initialData);
  const [loading, setLoading] = useState(false);

  const handleRequest = useCallback(async (run: () => Promise<TData>) => {
    setLoading(true);
    try {
      const result = await run();
      setDataState(result);
      return result;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return null;
      }
      toast.error(error instanceof ApiError ? error.message : "Ocurrió un error inesperado.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const setData = useCallback(
    (update: (previous: TData | null) => TData | null) => setDataState(update),
    [],
  );

  return { data, loading, handleRequest, setData };
};
