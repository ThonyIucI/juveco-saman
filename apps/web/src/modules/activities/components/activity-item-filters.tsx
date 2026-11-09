import { Label } from "@juveco/ui/components/label";
import { cn } from "@juveco/ui/lib/utils";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { NEIGHBORHOODS } from "@juveco/shared/neighborhoods";
import { fullName } from "@juveco/shared/people";
import { useId } from "react";

import FiltersModal from "@/common/components/filters-modal";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import Select, { type IOption } from "@/common/components/select";
import {
  EMPTY_ITEM_FILTERS,
  type IActivityItemFilters,
  type TCollectionStatus,
  collectionStatusLabels,
  countActiveFilters,
} from "@/modules/activities/utils/activity-items";

const STATUS_OPTIONS: IOption[] = (Object.keys(collectionStatusLabels) as TCollectionStatus[]).map((status) => ({
  value: status,
  label: collectionStatusLabels[status],
}));

/* Sin filtro elegido: solo «Todos», sin repetir el label. */
const ALL_PLACEHOLDER = "Todos";

const NEIGHBORHOOD_OPTIONS: IOption[] = NEIGHBORHOODS.map(({ id, name }) => ({ value: id, label: name }));

interface IFilterFieldsProps {
  filters: IActivityItemFilters;
  /** Los vendedores salen de lo vendido: solo quienes vendieron algo. */
  sellers: IActivityItemResource["seller"][];
  onChange: (filters: IActivityItemFilters) => void;
  /** En escritorio, en una fila a la derecha del buscador; en la modal, uno debajo del otro. */
  isRow?: boolean;
}

/** Estado según pago, vendedor y barrio (acordado 2026-11-07). Vacío es «todos». */
export function ActivityItemFilterFields({ filters, sellers, onChange, isRow = false }: IFilterFieldsProps) {
  /* La fila de escritorio y la modal pueden estar montadas a la vez: ids distintos. */
  const idPrefix = useId();
  const ids = { status: `${idPrefix}-status`, seller: `${idPrefix}-seller`, neighborhood: `${idPrefix}-neighborhood` };
  const sellerOptions: IOption[] = sellers.map((seller) => ({ value: seller.id, label: fullName(seller) }));
  /* En la fila de escritorio, del alto del buscador de al lado; en la modal, del de un formulario. */
  const selectSize = isRow ? "lg" : "md";
  const valueOf = (options: IOption[], value: string) => options.find((option) => option.value === value) ?? null;

  return (
    <div className={cn("grid gap-3", isRow ? "grid-cols-3" : "grid-cols-1")}>
      {/* Con label también en escritorio, y el placeholder solo «Todos» (Thony, 2026-11-09). */}
      <div className="space-y-2">
        <Label htmlFor={ids.status}>
          Estado de pago
        </Label>
        <Select
          inputId={ids.status}
          size={selectSize}
          options={STATUS_OPTIONS}
          placeholder={ALL_PLACEHOLDER}
          isClearable
          isSearchable={false}
          isHighlighted={filters.status !== ""}
          value={valueOf(STATUS_OPTIONS, filters.status)}
          onChange={(option) =>
            onChange({ ...filters, status: (option?.value as TCollectionStatus | undefined) ?? "" })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={ids.seller}>
          Vendedor
        </Label>
        <Select
          inputId={ids.seller}
          size={selectSize}
          options={sellerOptions}
          placeholder={ALL_PLACEHOLDER}
          isClearable
          noOptionsMessage={() => "Todavía nadie vendió"}
          isHighlighted={filters.sellerId !== ""}
          value={valueOf(sellerOptions, filters.sellerId)}
          onChange={(option) => onChange({ ...filters, sellerId: option?.value ?? "" })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={ids.neighborhood}>
          Barrio
        </Label>
        <Select
          inputId={ids.neighborhood}
          size={selectSize}
          options={NEIGHBORHOOD_OPTIONS}
          placeholder={ALL_PLACEHOLDER}
          isClearable
          isSearchable={false}
          formatOptionLabel={(option) => (
            <NeighborhoodBadge neighborhood={{ id: option.value, name: option.label }} hasIcon={false} />
          )}
          isHighlighted={filters.neighborhoodId !== ""}
          value={valueOf(NEIGHBORHOOD_OPTIONS, filters.neighborhoodId)}
          onChange={(option) => onChange({ ...filters, neighborhoodId: option?.value ?? "" })}
        />
      </div>
    </div>
  );
}

interface IActivityItemFiltersModalProps extends Omit<IFilterFieldsProps, "isRow"> {
  open: boolean;
  /** Cuántos quedan con los filtros puestos, para el botón «Ver N». */
  resultCount: number;
  onClose: () => void;
}

/** Los filtros en celular, en la modal de filtros común. */
export function ActivityItemFiltersModal({
  open,
  filters,
  sellers,
  resultCount,
  onChange,
  onClose,
}: IActivityItemFiltersModalProps) {
  return (
    <FiltersModal
      open={open}
      activeCount={countActiveFilters(filters)}
      resultCount={resultCount}
      onClear={() => onChange(EMPTY_ITEM_FILTERS)}
      onClose={onClose}
    >
      <ActivityItemFilterFields filters={filters} sellers={sellers} onChange={onChange} />
    </FiltersModal>
  );
}
