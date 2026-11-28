import { buttonVariants } from "@juveco/ui/components/button";
import {
  DWELLING_COORDINATE_DECIMALS,
  type IDwellingDetailResource,
  mapsUrlOf,
  wallMaterialText,
} from "@juveco/shared/dwellings";
import { CircleAlert, House, MapPin, Zap } from "lucide-react";

import { DetailList, DetailRow, DetailSection } from "@/common/components/detail-section";

import DwellingStatusBadge from "./dwelling-status-badge";

interface IDwellingInfoCardProps {
  dwelling: IDwellingDetailResource;
}

const LINK_CLASS = buttonVariants({ variant: "outline" });

/**
 * Los datos de la vivienda en una grilla etiqueta/valor compacta (el estado es una fila más),
 * con la observación y la nota debajo. Las acciones (Abrir en Maps y, a futuro, Fotos) van
 * juntas al pie de la card.
 */
export default function DwellingInfoCard({ dwelling }: IDwellingInfoCardProps) {
  const maps = mapsUrlOf(dwelling.latitude, dwelling.longitude);
  const coordinates =
    dwelling.latitude !== null && dwelling.longitude !== null
      ? `${dwelling.latitude.toFixed(DWELLING_COORDINATE_DECIMALS)}, ${dwelling.longitude.toFixed(DWELLING_COORDINATE_DECIMALS)}`
      : null;

  return (
    <DetailSection title="Datos de la vivienda" isBordered>
      <DetailList>
        <DetailRow icon={CircleAlert} label="Estado" isCompact>
          <DwellingStatusBadge status={dwelling.status} />
        </DetailRow>
        <DetailRow icon={Zap} label="Medidor" isCompact>
          {dwelling.meterNumber}
        </DetailRow>
        <DetailRow icon={House} label="Paredes" isCompact>
          {wallMaterialText(dwelling.wallMaterial, dwelling.wallMaterialOther)}
        </DetailRow>
        <DetailRow icon={MapPin} label="Ubicación" isCompact>
          {coordinates}
        </DetailRow>
      </DetailList>

      {dwelling.observation && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">Observación</p>
          <p className="whitespace-pre-line text-foreground">{dwelling.observation}</p>
        </div>
      )}
      {dwelling.note && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">Nota</p>
          <p className="whitespace-pre-line text-foreground">{dwelling.note}</p>
        </div>
      )}

      {/* Pie de acciones: acá se suma «Ver fotos» cuando lleguen las fotos (slice 2c). */}
      {maps && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <a href={maps} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            <MapPin />
            Abrir en Maps
          </a>
        </div>
      )}
    </DetailSection>
  );
}
