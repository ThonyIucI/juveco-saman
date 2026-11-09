import { Label } from "@juveco/ui/components/label";
import { cn } from "@juveco/ui/lib/utils";
import { NEIGHBORHOODS } from "@juveco/shared/neighborhoods";
import { type TUserRole, userRoleLabels } from "@juveco/shared/roles";
import { useId } from "react";

import FiltersModal from "@/common/components/filters-modal";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import Select, { type IOption } from "@/common/components/select";
import {
  EMPTY_USER_FILTERS,
  type IUserFilters,
  countActiveUserFilters,
} from "@/modules/users/utils/user-filters";

/* Sin filtro elegido: solo «Todos», sin repetir el label. */
const ALL_PLACEHOLDER = "Todos";

const ROLE_OPTIONS: IOption[] = (Object.keys(userRoleLabels) as TUserRole[]).map((role) => ({
  value: role,
  label: userRoleLabels[role],
}));

const NEIGHBORHOOD_OPTIONS: IOption[] = NEIGHBORHOODS.map(({ id, name }) => ({ value: id, label: name }));

interface IUserFilterFieldsProps {
  filters: IUserFilters;
  onChange: (filters: IUserFilters) => void;
  /** En escritorio, en una fila a la derecha del buscador; en la modal, uno debajo del otro. */
  isRow?: boolean;
}

/** Rol y barrio (Thony, 2026-11-09), como los filtros de cartillas. */
export function UserFilterFields({ filters, onChange, isRow = false }: IUserFilterFieldsProps) {
  /* La fila de escritorio y la modal pueden estar montadas a la vez: ids distintos. */
  const idPrefix = useId();
  const ids = { role: `${idPrefix}-role`, neighborhood: `${idPrefix}-neighborhood` };
  /* En la fila, del alto del buscador de al lado; en la modal, del de un formulario. */
  const selectSize = isRow ? "lg" : "md";
  const valueOf = (options: IOption[], value: string) => options.find((option) => option.value === value) ?? null;

  return (
    <div className={cn("grid gap-3", isRow ? "grid-cols-2" : "grid-cols-1")}>
      <div className="space-y-2">
        <Label htmlFor={ids.role}>Rol</Label>
        <Select
          inputId={ids.role}
          size={selectSize}
          options={ROLE_OPTIONS}
          placeholder={ALL_PLACEHOLDER}
          isClearable
          isSearchable={false}
          isHighlighted={filters.role !== ""}
          value={valueOf(ROLE_OPTIONS, filters.role)}
          onChange={(option) => onChange({ ...filters, role: (option?.value as TUserRole | undefined) ?? "" })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={ids.neighborhood}>Barrio</Label>
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

interface IUserFiltersModalProps extends Omit<IUserFilterFieldsProps, "isRow"> {
  open: boolean;
  /** Cuántos quedan con los filtros puestos, para el botón «Ver N». */
  resultCount: number;
  onClose: () => void;
}

/** Los filtros de usuarios en celular. */
export function UserFiltersModal({ open, filters, resultCount, onChange, onClose }: IUserFiltersModalProps) {
  return (
    <FiltersModal
      open={open}
      activeCount={countActiveUserFilters(filters)}
      resultCount={resultCount}
      onClear={() => onChange(EMPTY_USER_FILTERS)}
      onClose={onClose}
    >
      <UserFilterFields filters={filters} onChange={onChange} />
    </FiltersModal>
  );
}
