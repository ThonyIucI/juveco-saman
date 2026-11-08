import { Label } from "@juveco/ui/components/label";
import {
  EPaymentMethod,
  type IPaymentChange,
  PAYMENT_METHODS,
  PAYMENT_METHOD_REQUIRED_MESSAGE,
  type TPaymentMethod,
  paymentMethodLabels,
  paymentOverPendingMessage,
} from "@juveco/shared/activity-item-payments";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { INVALID_SOLES_MESSAGE, formatSoles, parseSoles, toSolesInput } from "@juveco/shared/money";
import { fullName } from "@juveco/shared/people";
import { useForm, useStore } from "@tanstack/react-form";
import { Banknote, type LucideIcon, Smartphone } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import OptionCards, { type IOptionCard } from "@/common/components/option-cards";
import SolesInput from "@/common/components/soles-input";
import { useCreateItemPayment } from "@/modules/activities/hooks/use-create-item-payment";
import { collectionOf } from "@/modules/activities/utils/activity-items";

const FORM_ID = "item-payment-form";

const METHOD_ICON: Record<TPaymentMethod, LucideIcon> = {
  [EPaymentMethod.YAPE]: Smartphone,
  [EPaymentMethod.CASH]: Banknote,
};

const METHOD_OPTIONS: IOptionCard<TPaymentMethod>[] = PAYMENT_METHODS.map((method) => ({
  value: method,
  label: paymentMethodLabels[method],
  icon: METHOD_ICON[method],
}));

/* El tope es lo que falta cobrar de este ítem (acordado 2026-11-07). */
const buildSchema = (pending: number) =>
  z.object({
    amount: z
      .string()
      .refine((value) => parseSoles(value) !== null, INVALID_SOLES_MESSAGE)
      .refine((value) => (parseSoles(value) ?? 0) <= pending, paymentOverPendingMessage(formatSoles(pending))),
    method: z.enum(PAYMENT_METHODS, PAYMENT_METHOD_REQUIRED_MESSAGE),
  });

interface IPaymentFormValues {
  amount: string;
  method: TPaymentMethod;
}

/* Lo más común es que pague todo lo que falta, en Yape. */
const buildDefaults = (pending: number): IPaymentFormValues => ({
  amount: toSolesInput(pending),
  method: EPaymentMethod.YAPE,
});

interface IItemPaymentFormModalProps {
  /** El ítem a cobrar; `null` cierra la modal. */
  item: IActivityItemResource | null;
  onSaved: (change: IPaymentChange<IActivityItemResource>) => void;
  onClose: () => void;
}

/** Registrar un pago: cuánto (hasta lo que falta) y si fue por Yape o en efectivo. */
export default function ItemPaymentFormModal({ item, onSaved, onClose }: IItemPaymentFormModalProps) {
  const CreateItemPayment = useCreateItemPayment();
  const pending = item ? collectionOf(item).pending : 0;

  const form = useForm({
    defaultValues: buildDefaults(pending),
    validators: { onSubmit: buildSchema(pending) },
    onSubmit: async ({ value }) => {
      const amount = parseSoles(value.amount);
      if (!item || amount === null) {
        return;
      }
      const change = await CreateItemPayment.handler(item, { amount, method: value.method });
      if (change) {
        onSaved(change);
        onClose();
      }
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  useEffect(() => {
    if (item) {
      form.reset(buildDefaults(pending));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  return (
    <Modal
      isDirty={isDirty}
      open={item !== null}
      title="Registrar pago"
      subtitle={item ? `N.º ${item.serial} · ${fullName(item.buyer)}` : undefined}
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons formId={FORM_ID} isSubmitting={isSubmitting} label={"Registrar pago"} />
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
              <OptionCards
                labelledBy="payment-method-label"
                options={METHOD_OPTIONS}
                value={field.state.value}
                onChange={field.handleChange}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
