interface IFieldErrorProps {
  /** `field.state.meta.errors` de TanStack Form, tal cual. */
  errors: readonly ({ message?: string } | undefined)[];
}

/** El mensaje de validación de un campo. Si no hay errores no renderiza nada. */
export default function FieldError({ errors }: IFieldErrorProps) {
  return errors.map((error) => (
    <p key={error?.message} className="text-sm font-semibold text-destructive">
      {error?.message}
    </p>
  ));
}
