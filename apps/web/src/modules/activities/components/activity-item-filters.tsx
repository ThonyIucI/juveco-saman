import { Button } from "@juveco/ui/components/button";
import { Label } from "@juveco/ui/components/label";
import { cn } from "@juveco/ui/lib/utils";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { NEIGHBORHOODS } from "@juveco/shared/neighborhoods";
import { fullName } from "@juveco/shared/people";
import { useId } from "react";

import Modal from "@/common/components/modal";
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

const NEIGHBORHOOD_OPTIONS: IOption[] = NEIGHBORHOODS.map(({ id, name }) => ({ value: id, label: name }));

interface IFilterFieldsProps {
  filters: IActivityItemFilters;
  /** Los vendedores salen de lo vendido: solo quienes vendieron algo. */
  sellers: IActivityItemResource["seller"][];
  onChange: (filters: IActivityItemFilters) => void;
  /** En escritorio, en una fila; en la modal, uno debajo del otro. */
  isRow?: boolean;
}

/** Estado según pago, vendedor y barrio (acordado 2026-11-07). Vacío es «todos». */
export function ActivityItemFilterFields({ filters, sellers, onChange, isRow = false }: IFilterFieldsProps) {
  /* La fila de escritorio y la modal pueden estar montadas a la vez: ids distintos. */
  const idPrefix = useId();
  const ids = { status: `${idPrefix}-status`, seller: `${idPrefix}-seller`, neighborhood: `${idPrefix}-neighborhood` };
  const sellerOptions: IOption[] = sellers.map((seller) => ({ value: seller.id, label: fullName(seller) }));
  const valueOf = (options: IOption[], value: string) => options.find((option) => option.value === value) ?? null;

  return (
    <div className={cn("grid gap-3", isRow ? "grid-cols-3" : "grid-cols-1")}>
      <div className="space-y-2">
        <Label htmlFor={ids.status} className={cn(isRow && "sr-only")}>
          Estado de pago
        </Label>
        <Select
          inputId={ids.status}
          options={STATUS_OPTIONS}
          placeholder="Todos los estados"
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
        <Label htmlFor={ids.seller} className={cn(isRow && "sr-only")}>
          Vendedor
        </Label>
        <Select
          inputId={ids.seller}
          options={sellerOptions}
          placeholder="Todos los vendedores"
          isClearable
          noOptionsMessage={() => "Todavía nadie vendió"}
          isHighlighted={filters.sellerId !== ""}
          value={valueOf(sellerOptions, filters.sellerId)}
          onChange={(option) => onChange({ ...filters, sellerId: option?.value ?? "" })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={ids.neighborhood} className={cn(isRow && "sr-only")}>
          Barrio
        </Label>
        <Select
          inputId={ids.neighborhood}
          options={NEIGHBORHOOD_OPTIONS}
          placeholder="Todos los barrios"
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

/** Los filtros en celular: se aplican al elegir, y el botón dice cuántos quedan. */
export function ActivityItemFiltersModal({
  open,
  filters,
  sellers,
  resultCount,
  onChange,
  onClose,
}: IActivityItemFiltersModalProps) {
  return (
    <Modal
      open={open}
      title="Filtros"
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={countActiveFilters(filters) === 0}
            onClick={() => onChange(EMPTY_ITEM_FILTERS)}
          >
            Limpiar
          </Button>
          <Button type="button" onClick={onClose}>
            Ver {resultCount}
          </Button>
        </>
      }
    >
      <ActivityItemFilterFields filters={filters} sellers={sellers} onChange={onChange} />
    </Modal>
  );
}
