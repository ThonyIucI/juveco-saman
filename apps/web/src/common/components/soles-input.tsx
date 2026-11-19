import { Input } from "@juveco/ui/components/input";

interface ISolesInputProps {
  id: string;
  value: string;
  placeholder: string;
  isInvalid?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
}

/**
 * Deja escribir solo un monto (Thony, 2026-11-17): dígitos, un separador (punto o coma) y
 * hasta dos decimales. Una letra o un segundo separador no entran.
 */
export const sanitizeSolesInput = (text: string): string => {
  const cleaned = text.replace(/[^\d.,]/g, "");
  const separatorIndex = cleaned.search(/[.,]/);
  if (separatorIndex === -1) {
    return cleaned;
  }
  const whole = cleaned.slice(0, separatorIndex);
  const decimals = cleaned.slice(separatorIndex + 1).replace(/[.,]/g, "").slice(0, 2);
  return `${whole}${cleaned[separatorIndex]}${decimals}`;
};

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
        onChange={(event) => onChange(sanitizeSolesInput(event.target.value))}
        className="pl-11 tabular-nums"
      />
    </div>
  );
}
