import { Input } from "@juveco/ui/components/input";
import { Label } from "@juveco/ui/components/label";
import type { ComponentProps } from "react";

import FieldError from "./field-error";

interface ITextFieldProps extends Omit<ComponentProps<"input">, "value" | "onChange"> {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  /** `field.state.meta.errors` de TanStack Form, tal cual. */
  errors: readonly ({ message?: string } | undefined)[];
}

/** Etiqueta + campo de texto + su error: lo que se repite en cada formulario. */
export default function TextField({ id, label, value, onValueChange, errors, ...inputProps }: ITextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        aria-invalid={errors.length > 0}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        {...inputProps}
      />
      <FieldError errors={errors} />
    </div>
  );
}
