import {
  ACTIVITY_ITEM_SERIAL_LENGTH_MESSAGE,
  ACTIVITY_ITEM_SERIAL_MAX_LENGTH,
  ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE,
  type IActivityItemChangeResult,
  type IActivityItemResource,
  padItemSerial,
} from "@juveco/shared/activity-items";
import { fullName } from "@juveco/shared/people";
import { useForm, useStore } from "@tanstack/react-form";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import TextField from "@/common/components/text-field";
import { useChangeActivityItem } from "@/modules/activities/hooks/use-change-activity-item";
import { findSameSerial } from "@/modules/activities/utils/activity-items";

const FORM_ID = "item-change-form";

const formSchema = z.object({
  serial: z
    .string()
    .trim()
    .min(1, ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE)
    .max(ACTIVITY_ITEM_SERIAL_MAX_LENGTH, ACTIVITY_ITEM_SERIAL_LENGTH_MESSAGE),
});

const DEFAULTS = { serial: "" };

interface IItemChangeFormModalProps {
  /** La cartilla perdida; `null` cierra la modal. */
  item: IActivityItemResource | null;
  /** Todas, para avisar si la serie nueva ya la tiene otro. */
  items: IActivityItemResource[];
  onSaved: (result: IActivityItemChangeResult) => void;
  onClose: () => void;
}

/**
 * Cambiar cartilla (Thony, 2026-11-11): el comprador perdió la suya. Se anula y se le da otra
 * con la serie nueva, que se lleva sus pagos. Es gratis: solo se pide la serie.
 */
export default function ItemChangeFormModal({ item, items, onSaved, onClose }: IItemChangeFormModalProps) {
  const ChangeActivityItem = useChangeActivityItem();

  const form = useForm({
    defaultValues: DEFAULTS,
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      if (!item) {
        return;
      }
      const result = await ChangeActivityItem.handler(item, padItemSerial(value.serial));
      if (result) {
        onSaved(result);
        onClose();
      }
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  useEffect(() => {
    if (item) {
      form.reset(DEFAULTS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  return (
    <Modal
      isDirty={isDirty}
      open={item !== null}
      title="Cambiar cartilla"
      subtitle={item ? `N.º ${item.serial} · ${fullName(item.buyer)}` : undefined}
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons formId={FORM_ID} isSubmitting={isSubmitting} label="Cambiar cartilla" />
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
        <form.Field name="serial">
          {(field) => {
            const sameSerial = findSameSerial(items, field.state.value);

            return (
              <div className="space-y-2">
                <TextField
                  id={field.name}
                  label="Serie nueva"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={ACTIVITY_ITEM_SERIAL_MAX_LENGTH}
                  placeholder="Ingresa la serie de la cartilla nueva"
                  value={field.state.value}
                  errors={field.state.meta.errors}
                  onBlur={() => {
                    const padded = padItemSerial(field.state.value);
                    if (padded !== field.state.value) {
                      field.handleChange(padded);
                    }
                    field.handleBlur();
                  }}
                  onValueChange={field.handleChange}
                />
                {sameSerial && (
                  <p role="status" className="flex items-start gap-1.5 text-sm font-medium text-yellow">
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                    Ya la tiene «{fullName(sameSerial.buyer)}». Puedes cambiarla igual.
                  </p>
                )}
              </div>
            );
          }}
        </form.Field>

        {/* La nota va al final (regla de formularios): qué pasa con la vieja y con lo pagado. */}
        <p className="text-sm text-muted-foreground">
          La N.º {item?.serial} queda anulada y la nueva se lleva lo que ya pagó. El cambio es gratis.
        </p>
      </form>
    </Modal>
  );
}
