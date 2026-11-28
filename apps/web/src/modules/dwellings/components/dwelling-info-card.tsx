import { buttonVariants } from "@juveco/ui/components/button";
import { type IDwellingDetailResource, wallMaterialLabels } from "@juveco/shared/dwellings";
import { House, Images, MapPin, Zap } from "lucide-react";

import { DetailList, DetailRow, DetailSection } from "@/common/components/detail-section";
import { dwellingCountsLabel } from "@/modules/dwellings/utils/dwellings";

import DwellingStatusBadge from "./dwelling-status-badge";

interface IDwellingInfoCardProps {
  dwelling: IDwellingDetailResource;
}

/* Sin enlace de Maps pero con coordenadas, se arma el de Google Maps. */
const mapsHref = (dwelling: IDwellingDetailResource): string | null => {
  if (dwelling.mapsUrl) {
    return dwelling.mapsUrl;
  }
  if (dwelling.latitude !== null && dwelling.longitude !== null) {
    return `https://www.google.com/maps?q=${dwelling.latitude},${dwelling.longitude}`;
  }
  return null;
};

const LINK_CLASS = buttonVariants({ variant: "outline" });

/**
 * Los datos de la vivienda: estado, medidor, material y ubicación, con los botones de Maps y de
 * la carpeta de fotos, y la observación y la nota debajo.
 */
export default function DwellingInfoCard({ dwelling }: IDwellingInfoCardProps) {
  const maps = mapsHref(dwelling);
  const coordinates =
    dwelling.latitude !== null && dwelling.longitude !== null ? `${dwelling.latitude}, ${dwelling.longitude}` : null;

  return (
    <DetailSection title="Vivienda" isBordered>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <DwellingStatusBadge status={dwelling.status} />
        <span className="text-sm text-muted-foreground">{dwellingCountsLabel(dwelling)}</span>
      </div>

      <DetailList>
        <DetailRow icon={Zap} label="Medidor">
          {dwelling.meterNumber}
        </DetailRow>
        <DetailRow icon={House} label="Paredes">
          {dwelling.wallMaterial ? wallMaterialLabels[dwelling.wallMaterial] : null}
        </DetailRow>
        <DetailRow icon={MapPin} label="Coordenadas">
          {coordinates}
        </DetailRow>
      </DetailList>

      {(maps || dwelling.photosUrl) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {maps && (
            <a href={maps} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              <MapPin />
              Abrir en Maps
            </a>
          )}
          {dwelling.photosUrl && (
            <a href={dwelling.photosUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              <Images />
              Ver fotos
            </a>
          )}
        </div>
      )}

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
    </DetailSection>
  );
}
