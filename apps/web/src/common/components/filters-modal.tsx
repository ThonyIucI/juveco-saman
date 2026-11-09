import { Button } from "@juveco/ui/components/button";
import type { ReactNode } from "react";

import Modal from "@/common/components/modal";

interface IFiltersModalProps {
  open: boolean;
  /** Cuántos filtros hay puestos: sin ninguno, «Limpiar» no hace nada. */
  activeCount: number;
  /** Cuántos quedan con los filtros puestos, para el botón «Ver N». */
  resultCount: number;
  onClear: () => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Los filtros en celular: se aplican al elegir (filtran lo ya cargado, sin pedir nada al
 * server) y el botón dice cuántos quedan. Lo usan cartillas y usuarios.
 */
export default function FiltersModal({
  open,
  activeCount,
  resultCount,
  onClear,
  onClose,
  children,
}: IFiltersModalProps) {
  return (
    <Modal
      open={open}
      title="Filtros"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" disabled={activeCount === 0} onClick={onClear}>
            Limpiar
          </Button>
          <Button type="button" onClick={onClose}>
            Ver {resultCount}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
