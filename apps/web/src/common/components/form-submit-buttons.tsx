import { Button } from "@juveco/ui/components/button";
import { Loader2 } from "lucide-react";

interface IFormSubmitButtonsProps {
  formId: string;
  isSubmitting: boolean;
  /** El botón principal: «Crear», «Guardar cambios», «Registrar pago»… */
  label: string;
  /** Solo al crear: muestra «Crear y seguir creando», que guarda y deja el formulario abierto. */
  onSubmitAndContinue?: () => void;
}

/**
 * Pie de los formularios en modal (Thony, 2026-11-08): sin «Cancelar», para eso está la ✕.
 * Al crear van «Crear y seguir creando» (secundario) y «Crear» (primary), como en id-pos.
 */
export default function FormSubmitButtons({
  formId,
  isSubmitting,
  label,
  onSubmitAndContinue,
}: IFormSubmitButtonsProps) {
  return (
    <>
      {onSubmitAndContinue && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            /* El botón nunca se apaga: un segundo clic mientras guarda no hace nada. */
            if (!isSubmitting) {
              onSubmitAndContinue();
            }
          }}
        >
          Crear y seguir creando
        </Button>
      )}
      {/* Ancho mínimo: un «Crear» corto no queda como un botón angosto (Thony, 2026-11-09). */}
      <Button type="submit" form={formId} className="min-w-32">
        {isSubmitting && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        {label}
      </Button>
    </>
  );
}
