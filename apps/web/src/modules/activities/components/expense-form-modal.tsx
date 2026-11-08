import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import {
  EXPENSE_CONCEPT_LENGTH_MESSAGE,
  EXPENSE_CONCEPT_MAX_LENGTH,
  EXPENSE_CONCEPT_REQUIRED_MESSAGE,
  type IActivityExpenseInput,
  type IActivityExpenseResource,
} from "@juveco/shared/activity-expenses";
import { INVALID_SOLES_MESSAGE, parseSoles, toSolesInput } from "@juveco/shared/money";
import { PERSON_NOTE_LENGTH_MESSAGE, PERSON_NOTE_MAX_LENGTH } from "@juveco/shared/people";
import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useRef } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import SolesInput from "@/common/components/soles-input";
import TextField from "@/common/components/text-field";
import { useCreateActivityExpense } from "@/modules/activities/hooks/use-create-activity-expense";
import { useUpdateActivityExpense } from "@/modules/activities/hooks/use-update-activity-expense";

const FORM_ID = "expense-form";

const formSchema = z.object({
  concept: z
    .string()
    .trim()
    .min(1, EXPENSE_CONCEPT_REQUIRED_MESSAGE)
    .max(EXPENSE_CONCEPT_MAX_LENGTH, EXPENSE_CONCEPT_LENGTH_MESSAGE),
  amount: z.string().refine((value) => parseSoles(value) !== null, INVALID_SOLES_MESSAGE),
  note: z.string().max(PERSON_NOTE_MAX_LENGTH, PERSON_NOTE_LENGTH_MESSAGE),
});

type TExpenseFormValues = z.input<typeof formSchema>;

const buildDefaults = (expense?: IActivityExpenseResource): TExpenseFormValues => ({
  concept: expense?.concept ?? "",
  amount: expense ? toSolesInput(expense.amount) : "",
  note: expense?.note ?? "",
});

const toPayload = (value: TExpenseFormValues): IActivityExpenseInput => ({
  concept: value.concept.trim(),
  /* El esquema ya garantizó que es un monto válido. */
  amount: parseSoles(value.amount) ?? 0,
  note: value.note.trim() || null,
});

interface IExpenseFormModalProps {
  open: boolean;
  activityId: string;
  /** Sin gasto: nuevo. Con gasto: edición. */
  expense?: IActivityExpenseResource;
  onSaved: (expense: IActivityExpenseResource) => void;
  onClose: () => void;
}

/** Un gasto de la actividad (impresión de cartillas, alquiler…): concepto, monto y una nota. */
export default function ExpenseFormModal({ open, activityId, expense, onSaved, onClose }: IExpenseFormModalProps) {
  const CreateActivityExpense = useCreateActivityExpense();
  const UpdateActivityExpense = useUpdateActivityExpense();

  /* «Crear y seguir creando»: guarda y deja el formulario abierto, vacío, para el siguiente. */
  const keepOpenRef = useRef(false);

  const form = useForm({
    defaultValues: buildDefaults(expense),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = toPayload(value);
      const saved = expense
        ? await UpdateActivityExpense.handler(expense, payload)
        : await CreateActivityExpense.handler(activityId, payload);
      if (!saved) {
        return;
      }
      onSaved(saved);
      if (keepOpenRef.current) {
        form.reset(buildDefaults());
        return;
      }
      onClose();
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(expense));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense]);

  return (
    <Modal
      isDirty={isDirty}
      open={open}
      title={expense ? "Editar gasto" : "Nuevo gasto"}
      width="lg"
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons
              formId={FORM_ID}
              isSubmitting={isSubmitting}
              label={expense ? "Guardar cambios" : "Crear"}
              onSubmitAndContinue={
                expense
                  ? undefined
                  : () => {
                      keepOpenRef.current = true;
                      form.handleSubmit();
                    }
              }
            />
          )}
        </form.Subscribe>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          /* Enter o el botón principal: guarda y cierra. «Crear y seguir creando» no pasa por acá. */
          keepOpenRef.current = false;
          if (!form.state.isSubmitting) {
            form.handleSubmit();
          }
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="concept">
            {(field) => (
              <TextField
                id={field.name}
                label="Concepto"
                autoComplete="off"
                maxLength={EXPENSE_CONCEPT_MAX_LENGTH}
                placeholder="Ingresa el concepto"
                value={field.state.value}
                errors={field.state.meta.errors}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
              />
            )}
          </form.Field>

          <form.Field name="amount">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Monto</Label>
                <SolesInput
                  id={field.name}
                  placeholder="Ingresa el monto"
                  isInvalid={field.state.meta.errors.length > 0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="note">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nota (opcional)</Label>
              <Textarea
                id={field.name}
                name={field.name}
                rows={3}
                maxLength={PERSON_NOTE_MAX_LENGTH}
                placeholder="Ingresa una nota"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="min-h-24 rounded-lg border border-border bg-field px-4 py-3 text-sm font-medium focus-visible:ring-4 focus-visible:ring-ring/30 md:text-sm"
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
