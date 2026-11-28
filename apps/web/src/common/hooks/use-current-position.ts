import { useState } from "react";
import { toast } from "sonner";

const GEOLOCATION_TIMEOUT_MS = 15_000;
/* Con 6 decimales la precisión es de unos 10 cm: de sobra, y el número queda corto. */
const COORDINATE_DECIMALS = 6;

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

const GEOLOCATION_ERROR_MESSAGES: Record<number, string> = {
  1: "No diste permiso para usar tu ubicación. Actívalo en el navegador o escribe las coordenadas.",
  2: "No pudimos saber dónde estás. Prueba afuera o escribe las coordenadas.",
  3: "La ubicación tardó demasiado. Intenta de nuevo.",
};

const roundCoordinate = (value: number) => Number(value.toFixed(COORDINATE_DECIMALS));

/**
 * La ubicación del aparato (GPS del celular). `handler` devuelve las coordenadas, o `null` si
 * no se pudo: en ese caso ya se mostró un toast que explica qué pasó.
 */
export const useCurrentPosition = () => {
  const [loading, setLoading] = useState(false);

  const handler = (): Promise<ICoordinates | null> => {
    if (!("geolocation" in navigator)) {
      toast.error("Este aparato no permite saber la ubicación. Escribe las coordenadas.");
      return Promise.resolve(null);
    }
    setLoading(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoading(false);
          resolve({
            latitude: roundCoordinate(position.coords.latitude),
            longitude: roundCoordinate(position.coords.longitude),
          });
        },
        (error) => {
          setLoading(false);
          toast.error(GEOLOCATION_ERROR_MESSAGES[error.code] ?? "No pudimos obtener tu ubicación.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS },
      );
    });
  };

  return { loading, handler };
};
