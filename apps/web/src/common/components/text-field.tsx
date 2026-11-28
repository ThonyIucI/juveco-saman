import { Input } from "@juveco/ui/components/input";
import { Label } from "@juveco/ui/components/label";
import { cn } from "@juveco/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import FieldError from "./field-error";

interface ITextFieldProps extends Omit<ComponentProps<"input">, "value" | "onChange"> {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  /** `field.state.meta.errors` de TanStack Form, tal cual. */
  errors: readonly ({ message?: string } | undefined)[];
  /** Ícono a la izquierda, dentro del campo (p. ej. el rayo del medidor). */
  icon?: LucideIcon;
}

/** Etiqueta + campo de texto + su error: lo que se repite en cada formulario. */
export default function TextField({
  id,
  label,
  value,
  onValueChange,
  errors,
  icon: Icon,
  className,
  ...inputProps
}: ITextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon && (
          <Icon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id={id}
          name={id}
          aria-invalid={errors.length > 0}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className={cn(Icon && "pl-11", className)}
          {...inputProps}
        />
      </div>
      <FieldError errors={errors} />
    </div>
  );
}
