import { Button } from "@juveco/ui/components/button";
import { Input } from "@juveco/ui/components/input";
import { Label } from "@juveco/ui/components/label";
import { cn } from "@juveco/ui/lib/utils";
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
import { useForm } from "@tanstack/react-form";
import { Banknote, Loader2, type LucideIcon, Smartphone } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import { useCreateItemPayment } from "@/modules/activities/hooks/use-create-item-payment";
import { collectionOf } from "@/modules/activities/utils/activity-items";

const FORM_ID = "item-payment-form";

const METHOD_ICON: Record<TPaymentMethod, LucideIcon> = {
  [EPaymentMethod.YAPE]: Smartphone,
  [EPaymentMethod.CASH]: Banknote,
};

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

  useEffect(() => {
    if (item) {
      form.reset(buildDefaults(pending));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  return (
    <Modal
      open={item !== null}
      title="Registrar pago"
      subtitle={item ? `N.º ${item.serial} · ${fullName(item.buyer)}` : undefined}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={FORM_ID}>
                {isSubmitting && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                Registrar pago
              </Button>
            )}
          </form.Subscribe>
        </>
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
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-medium text-muted-foreground"
                >
                  S/
                </span>
                <Input
                  id={field.name}
                  name={field.name}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Ingresa el monto"
                  aria-invalid={field.state.meta.errors.length > 0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className="pl-11 tabular-nums"
                />
              </div>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="method">
          {(field) => (
            <div className="space-y-2">
              <Label id="payment-method-label">Cómo pagó</Label>
              <div role="radiogroup" aria-labelledby="payment-method-label" className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = METHOD_ICON[method];
                  const isSelected = field.state.value === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => field.handleChange(method)}
                      className={cn(
                        "flex h-13 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-field text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon aria-hidden className="size-5" />
                      {paymentMethodLabels[method]}
                    </button>
                  );
                })}
              </div>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
