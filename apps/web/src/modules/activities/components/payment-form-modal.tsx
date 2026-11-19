import { Label } from "@juveco/ui/components/label";
import {
  EPaymentMethod,
  type IActivityItemPaymentInput,
  PAYMENT_COLLECTOR_REQUIRED_MESSAGE,
  PAYMENT_METHODS,
  PAYMENT_METHOD_REQUIRED_MESSAGE,
  type TPaymentMethod,
  paymentMethodLabels,
  paymentOverPendingMessage,
} from "@juveco/shared/activity-item-payments";
import { INVALID_SOLES_MESSAGE, formatSoles, parseSoles, toSolesInput } from "@juveco/shared/money";
import { fullName } from "@juveco/shared/people";
import { EUserRole } from "@juveco/shared/roles";
import type { IUserResource } from "@juveco/shared/users";
import { useForm, useStore } from "@tanstack/react-form";
import { Banknote, type LucideIcon, Smartphone } from "lucide-react";
import { useEffect, useMemo } from "react";
import z from "zod";

import ButtonGroup, { type IButtonGroupOption } from "@/common/components/button-group";
import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import Select from "@/common/components/select";
import SolesInput from "@/common/components/soles-input";

const FORM_ID = "payment-form";

const METHOD_ICON: Record<TPaymentMethod, LucideIcon> = {
  [EPaymentMethod.YAPE]: Smartphone,
  [EPaymentMethod.CASH]: Banknote,
};

const METHOD_OPTIONS: IButtonGroupOption<TPaymentMethod>[] = PAYMENT_METHODS.map((method) => ({
  value: method,
  label: paymentMethodLabels[method],
  icon: METHOD_ICON[method],
}));

/* El tope es lo que falta cobrar (acordado 2026-11-07). */
const buildSchema = (pending: number) =>
  z.object({
    amount: z
      .string()
      .refine((value) => parseSoles(value) !== null, INVALID_SOLES_MESSAGE)
      .refine((value) => (parseSoles(value) ?? 0) <= pending, paymentOverPendingMessage(formatSoles(pending))),
    method: z.enum(PAYMENT_METHODS, PAYMENT_METHOD_REQUIRED_MESSAGE),
    collectorId: z.string().min(1, PAYMENT_COLLECTOR_REQUIRED_MESSAGE),
  });

interface IPaymentFormValues {
  amount: string;
  method: TPaymentMethod;
  collectorId: string;
}

/* Lo más común es que pague todo lo que falta, en Yape, y que cobre quien lo registra. */
const buildDefaults = (pending: number, currentUserId: string): IPaymentFormValues => ({
  amount: toSolesInput(pending),
  method: EPaymentMethod.YAPE,
  collectorId: currentUserId,
});

interface IPaymentFormModalProps {
  open: boolean;
  /** Qué se cobra: «N.º 0101 · Ana Pérez», «Los Halcones · inscripción». */
  subtitle?: string;
  /** Lo que falta cobrar: el monto por defecto y el tope. */
  pending: number;
  /** El admin de la sesión: viene puesto en «Cobrado por». */
  currentUserId: string;
  /** Las personas: de ahí salen los administradores que pueden cobrar. */
  users: IUserResource[];
  /** Registra el pago; `true` si se guardó y la modal se puede cerrar. */
  onSubmit: (payload: IActivityItemPaymentInput) => Promise<boolean>;
  onClose: () => void;
}

/**
 * Registrar un pago, sea de una cartilla o de la inscripción de un equipo: cuánto (hasta lo
 * que falta), si fue por Yape o en efectivo y quién cobró. Un pago mal puesto no se edita: se
 * elimina desde el detalle y se registra de nuevo.
 */
export default function PaymentFormModal({
  open,
  subtitle,
  pending,
  currentUserId,
  users,
  onSubmit,
  onClose,
}: IPaymentFormModalProps) {
  /* Cobran los mismos que venden: administradores y superadmin. */
  const collectorOptions = useMemo(
    () =>
      users
        .filter((user) => user.role === EUserRole.ADMIN || user.role === EUserRole.SUPERADMIN)
        .map((user) => ({ value: user.id, label: fullName(user) })),
    [users],
  );

  const form = useForm({
    defaultValues: buildDefaults(pending, currentUserId),
    validators: { onSubmit: buildSchema(pending) },
    onSubmit: async ({ value }) => {
      const amount = parseSoles(value.amount);
      if (amount === null) {
        return;
      }
      const isSaved = await onSubmit({ amount, method: value.method, collectorId: value.collectorId });
      if (isSaved) {
        onClose();
      }
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(pending, currentUserId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      isDirty={isDirty}
      open={open}
      title="Registrar pago"
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons formId={FORM_ID} isSubmitting={isSubmitting} label="Registrar pago" />
          )}
        </form.Subscribe>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!form.state.isSubmitting) {
            form.handleSubmit();
          }
        }}
        className="space-y-4"
      >
        <p className="text-sm text-muted-foreground">
          Por cobrar: <span className="font-semibold text-foreground tabular-nums">{formatSoles(pending)}</span>
        </p>

        {/* Monto y método en una fila; debajo, quién cobró (Thony, 2026-11-19). */}
        <div className="grid grid-cols-2 items-start gap-3">
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

          <form.Field name="method">
            {(field) => (
              <div className="space-y-2">
                <Label id="payment-method-label">Cómo pagó</Label>
                <ButtonGroup
                  labelledBy="payment-method-label"
                  options={METHOD_OPTIONS}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="collectorId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Cobrado por</Label>
              <Select
                inputId={field.name}
                options={collectorOptions}
                placeholder="Elige quién cobró"
                isInvalid={field.state.meta.errors.length > 0}
                value={collectorOptions.find((option) => option.value === field.state.value) ?? null}
                onChange={(option) => field.handleChange(option?.value ?? "")}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
