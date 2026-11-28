import { DWELLING_COORDINATE_DECIMALS, SAMAN_MAP_CENTER } from "@juveco/shared/dwellings";
import { type LatLngExpression, type LeafletMouseEvent, type Marker as LeafletMarker, icon } from "leaflet";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import type { ICoordinates } from "@/common/hooks/use-current-position";

export type TMapLayer = "satellite" | "streets";

const INITIAL_ZOOM_WITHOUT_PIN = 16;
const INITIAL_ZOOM_WITH_PIN = 18;
const FLY_TO_ZOOM = 19;
/* El máximo real de las imágenes satelitales de Esri en la zona. */
const MAX_ZOOM = 19;

const TILE_LAYERS: Record<TMapLayer, { url: string; attribution: string }> = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
  streets: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
  },
};

/* El ícono por defecto de Leaflet busca sus imágenes por una ruta que Vite no resuelve. */
const PIN_ICON = icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const roundCoordinate = (value: number) => Number(value.toFixed(DWELLING_COORDINATE_DECIMALS));

const toCoordinates = (point: { lat: number; lng: number }): ICoordinates => ({
  latitude: roundCoordinate(point.lat),
  longitude: roundCoordinate(point.lng),
});

/** Pedir que el mapa vuele a un punto (el `id` cambia en cada pedido, aunque el punto se repita). */
export interface IFlyTarget extends ICoordinates {
  id: number;
}

interface IDwellingLocationMapProps {
  /** El pin; `null` si todavía no se puso. */
  position: ICoordinates | null;
  layer: TMapLayer;
  flyTarget: IFlyTarget | null;
  onChange: (position: ICoordinates) => void;
}

function ClickToPlace({ onChange }: { onChange: (position: ICoordinates) => void }) {
  useMapEvents({
    click: (event: LeafletMouseEvent) => onChange(toCoordinates(event.latlng)),
  });
  return null;
}

function FlyToTarget({ target }: { target: IFlyTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.latitude, target.longitude], Math.max(map.getZoom(), FLY_TO_ZOOM));
    }
    // Solo cuando llega un pedido nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);
  return null;
}

/**
 * Mapa de Leaflet para ubicar la vivienda: se toca para poner el pin y el pin se arrastra. Se
 * carga con import dinámico (trae Leaflet y su CSS) para no engordar el resto de la app.
 */
export default function DwellingLocationMap({ position, layer, flyTarget, onChange }: IDwellingLocationMapProps) {
  const markerRef = useRef<LeafletMarker | null>(null);
  const tileLayer = TILE_LAYERS[layer];

  /* El centro solo cuenta al abrir: después el mapa lo mueve la persona. */
  const initialCenter = useMemo<LatLngExpression>(
    () =>
      position
        ? [position.latitude, position.longitude]
        : [SAMAN_MAP_CENTER.latitude, SAMAN_MAP_CENTER.longitude],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const eventHandlers = useMemo(
    () => ({
      dragend: () => {
        const marker = markerRef.current;
        if (marker) {
          onChange(toCoordinates(marker.getLatLng()));
        }
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={initialCenter}
      zoom={position ? INITIAL_ZOOM_WITH_PIN : INITIAL_ZOOM_WITHOUT_PIN}
      maxZoom={MAX_ZOOM}
      scrollWheelZoom
      /* `isolate`: los paneles de Leaflet (z-index hasta 1000) no pasan por encima del encabezado y el pie de la modal. */
      className="isolate h-72 w-full rounded-lg sm:h-80"
    >
      <TileLayer
        key={layer}
        url={tileLayer.url}
        attribution={tileLayer.attribution}
        maxZoom={MAX_ZOOM}
      />
      <ClickToPlace onChange={onChange} />
      <FlyToTarget target={flyTarget} />
      {position && (
        <Marker
          draggable
          ref={markerRef}
          icon={PIN_ICON}
          position={[position.latitude, position.longitude]}
          eventHandlers={eventHandlers}
        />
      )}
    </MapContainer>
  );
}
