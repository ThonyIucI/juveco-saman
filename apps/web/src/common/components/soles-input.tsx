import { Input } from "@juveco/ui/components/input";

interface ISolesInputProps {
  id: string;
  value: string;
  placeholder: string;
  isInvalid?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
}

/** Un monto en soles: «S/» a la izquierda y teclado decimal en el celular. */
export default function SolesInput({ id, value, placeholder, isInvalid, onBlur, onChange }: ISolesInputProps) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-medium text-muted-foreground"
      >
        S/
      </span>
      <Input
        id={id}
        name={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        aria-invalid={isInvalid}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className="pl-11 tabular-nums"
      />
    </div>
  );
}
