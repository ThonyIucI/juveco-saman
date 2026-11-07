import { IconButton, iconButtonVariants } from "@juveco/ui/components/icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@juveco/ui/components/dropdown-menu";
import { type LucideIcon, MoreVertical } from "lucide-react";
import { Fragment } from "react";

export interface IRowAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  /** Botón de ícono suelto, siempre visible. Sin esto va al menú de tres puntos. */
  inline?: boolean;
  variant?: "default" | "destructive";
}

interface IRowActionsProps {
  actions: IRowAction[];
  /**
   * Botones con borde, para la tabla de escritorio (acordado 2026-10-22).
   * PENDIENTE (Thony, 2026-10-22): revisar si es sobreingeniería. Hoy el borde y las
   * acciones llegan por props (`isBordered`, el arreglo de `buildActions`) y «enviar» va
   * aparte en `SendAccessButton`; ver si conviene un componente de acciones de fila más
   * simple que reúna todo.
   */
  isBordered?: boolean;
}


/**
 * Acciones de una fila de tabla o de una card de listado (mismo patrón que el saas).
 * Frena el clic para que no abra el detalle de la fila que la contiene.
 */
export default function RowActions({ actions, isBordered = false }: IRowActionsProps) {
  const inlineActions = actions.filter((action) => action.inline);
  const menuActions = actions.filter((action) => !action.inline);

  return (
    <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
      {inlineActions.map(({ icon: Icon, label, onClick, variant }) => (
        <IconButton
          key={label}
          label={label}
          tone={variant === "destructive" ? "destructive" : "neutral"}
          isBordered={isBordered}
          onClick={onClick}
          className="border-r"
        >
          <Icon />
        </IconButton>
      ))}

      {menuActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            title="Más acciones"
            aria-label="Más acciones"
            className={iconButtonVariants({ isBordered })}
          >
            <MoreVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto">
            {menuActions.map(({ icon: Icon, label, onClick, variant }, index) => {
              const isFirstDestructive =
                variant === "destructive" && index > 0 && menuActions[index - 1]?.variant !== "destructive";

              return (
                <Fragment key={label}>
                  {isFirstDestructive && <DropdownMenuSeparator />}
                  <DropdownMenuItem variant={variant} onClick={onClick}>
                    <Icon />
                    {label}
                  </DropdownMenuItem>
                </Fragment>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
