import { Button } from "@juveco/ui/components/button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import { DWELLING_COORDINATE_DECIMALS } from "@juveco/shared/dwellings";
import { LocateFixed, MapPinOff } from "lucide-react";
import { Suspense, lazy, useState } from "react";

import { type ICoordinates, useCurrentPosition } from "@/common/hooks/use-current-position";

import type { IFlyTarget, TMapLayer } from "./dwelling-location-map";

/* Leaflet y su CSS viajan en un chunk aparte: solo se bajan al llegar a este paso. */
const DwellingLocationMap = lazy(() => import("./dwelling-location-map"));

const LAYER_OPTIONS: readonly { value: TMapLayer; label: string }[] = [
  { value: "satellite", label: "Satélite" },
  { value: "streets", label: "Calles" },
];

const formatCoordinate = (value: number) => value.toFixed(DWELLING_COORDINATE_DECIMALS);

interface IDwellingLocationStepProps {
  position: ICoordinates | null;
  onChange: (position: ICoordinates | null) => void;
}

/**
 * Paso «Ubicación»: mapa satelital (o de calles) con un pin que se mueve tocando o arrastrando.
 * Las coordenadas salen del pin; «Usar mi ubicación» lo lleva al GPS del celular.
 */
export default function DwellingLocationStep({ position, onChange }: IDwellingLocationStepProps) {
  const CurrentPosition = useCurrentPosition();
  const [layer, setLayer] = useState<TMapLayer>("satellite");
  const [flyTarget, setFlyTarget] = useState<IFlyTarget | null>(null);

  const locateMe = async () => {
    if (CurrentPosition.loading) {
      return;
    }
    const found = await CurrentPosition.handler();
    if (found) {
      onChange(found);
      setFlyTarget((previous) => ({ ...found, id: (previous?.id ?? 0) + 1 }));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={locateMe}>
          <LocateFixed className={cn(CurrentPosition.loading && "animate-pulse motion-reduce:animate-none")} />
          {CurrentPosition.loading ? "Buscando tu ubicación…" : "Usar mi ubicación"}
        </Button>

        <div role="group" aria-label="Tipo de mapa" className="inline-flex gap-0.5 rounded-lg bg-muted p-0.5">
          {LAYER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={layer === option.value}
              onClick={() => setLayer(option.value)}
              className={cn(
                "h-9 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
                layer === option.value && "bg-card text-foreground shadow-sm",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg sm:h-80" />}>
        <DwellingLocationMap position={position} layer={layer} flyTarget={flyTarget} onChange={onChange} />
      </Suspense>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          {position ? (
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {formatCoordinate(position.latitude)}, {formatCoordinate(position.longitude)}
            </span>
          ) : (
            "Toca el mapa para poner el pin en la casa."
          )}
        </p>
        {position && (
          <Button type="button" variant="outline" onClick={() => onChange(null)}>
            <MapPinOff />
            Quitar ubicación
          </Button>
        )}
      </div>
    </div>
  );
}
