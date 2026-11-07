import { Button } from "@juveco/ui/components/button";
import { Input } from "@juveco/ui/components/input";
import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import { type IActivityResource, activityItemLabels } from "@juveco/shared/activities";
import {
  ACTIVITY_ITEM_BUYER_REQUIRED_MESSAGE,
  ACTIVITY_ITEM_SERIAL_LENGTH_MESSAGE,
  ACTIVITY_ITEM_SERIAL_MAX_LENGTH,
  ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE,
  type IActivityItemInput,
  type IActivityItemResource,
} from "@juveco/shared/activity-items";
import { INVALID_SOLES_MESSAGE, parseSoles, toSolesInput } from "@juveco/shared/money";
import { PERSON_NOTE_LENGTH_MESSAGE, PERSON_NOTE_MAX_LENGTH, fullName } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";
import { useForm } from "@tanstack/react-form";
import { Loader2, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import TextField from "@/common/components/text-field";
import { useCreateActivityItem } from "@/modules/activities/hooks/use-create-activity-item";
import { useUpdateActivityItem } from "@/modules/activities/hooks/use-update-activity-item";
import { findSameSerial } from "@/modules/activities/utils/activity-items";
import UserSearch from "@/modules/users/components/user-search";

const FORM_ID = "activity-item-form";

const formSchema = z.object({
  serial: z
    .string()
    .trim()
    .min(1, ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE)
    .max(ACTIVITY_ITEM_SERIAL_MAX_LENGTH, ACTIVITY_ITEM_SERIAL_LENGTH_MESSAGE),
  price: z.string().refine((value) => parseSoles(value) !== null, INVALID_SOLES_MESSAGE),
  buyerId: z.string().min(1, ACTIVITY_ITEM_BUYER_REQUIRED_MESSAGE),
  note: z.string().max(PERSON_NOTE_MAX_LENGTH, PERSON_NOTE_LENGTH_MESSAGE),
});

type TActivityItemFormValues = z.input<typeof formSchema>;

/* Uno nuevo toma el precio de la actividad; uno existente, el suyo. */
const buildDefaults = (activity: IActivityResource, item?: IActivityItemResource): TActivityItemFormValues => ({
  serial: item?.serial ?? "",
  price: toSolesInput(item?.price ?? activity.defaultPrice),
  buyerId: item?.buyer.id ?? "",
  note: item?.note ?? "",
});

const toPayload = (value: TActivityItemFormValues): IActivityItemInput => ({
  serial: value.serial.trim(),
  buyerId: value.buyerId,
  /* El esquema ya garantizó que es un precio válido. */
  price: parseSoles(value.price) ?? undefined,
  note: value.note.trim() || null,
});

interface IActivityItemFormModalProps {
  open: boolean;
  activity: IActivityResource;
  /** Sin ítem: venta nueva. Con ítem: edición. */
  item?: IActivityItemResource;
  /** Todo lo vendido en la actividad, para avisar si la serie ya está. */
  items: IActivityItemResource[];
  /** Las personas para elegir al comprador. */
  users: IUserResource[];
  /** Una persona creada desde el buscador: la lista de usuarios se entera. */
  onUserCreated: (user: IUserResource) => void;
  onSaved: (item: IActivityItemResource) => void;
  onClose: () => void;
}

/** Venta y edición de un ítem (en un bingo, una cartilla): serie, precio, quién lo compró y una nota. */
export default function ActivityItemFormModal({
  open,
  activity,
  item,
  items,
  users,
  onUserCreated,
  onSaved,
  onClose,
}: IActivityItemFormModalProps) {
  const isEdit = Boolean(item);
  const itemLabel = activityItemLabels[activity.type].singular;
  const CreateActivityItem = useCreateActivityItem();
  const UpdateActivityItem = useUpdateActivityItem();

  const form = useForm({
    defaultValues: buildDefaults(activity, item),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = toPayload(value);
      const saved = item
        ? await UpdateActivityItem.handler(item, payload)
        : await CreateActivityItem.handler(activity.id, payload);

      if (saved) {
        onSaved(saved);
        onClose();
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(activity, item));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  return (
    <Modal
      open={open}
      title={isEdit ? `Editar ${itemLabel}` : `Nueva ${itemLabel}`}
      subtitle={activity.name}
      width="lg"
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
                {isEdit ? "Guardar cambios" : `Agregar ${itemLabel}`}
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
          /* El botón nunca se apaga: un segundo clic mientras guarda no hace nada. */
          if (!form.state.isSubmitting) {
            form.handleSubmit();
          }
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="serial">
            {(field) => {
              const sameSerial = findSameSerial(items, field.state.value, item?.id);

              return (
                <div className="space-y-2">
                  <TextField
                    id={field.name}
                    label="Serie"
                    autoCapitalize="characters"
                    autoComplete="off"
                    maxLength={ACTIVITY_ITEM_SERIAL_MAX_LENGTH}
                    placeholder="Ingresa la serie"
                    value={field.state.value}
                    errors={field.state.meta.errors}
                    onBlur={field.handleBlur}
                    onValueChange={field.handleChange}
                  />
                  {/* Se deja guardar igual (acordado 2026-11-07): solo se avisa. */}
                  {sameSerial && (
                    <p role="status" className="flex items-start gap-1.5 text-sm font-medium text-yellow">
                      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                      Ya la tiene «{fullName(sameSerial.buyer)}». Puedes guardarla igual.
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="price">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Precio</Label>
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
                    placeholder="Ingresa el precio"
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
        </div>

        <form.Field name="buyerId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Comprador</Label>
              <UserSearch
                id={field.name}
                users={users}
                value={users.find((user) => user.id === field.state.value) ?? null}
                isInvalid={field.state.meta.errors.length > 0}
                onChange={(user) => field.handleChange(user?.id ?? "")}
                onCreated={onUserCreated}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

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
                className="min-h-24 rounded-xl border-2 bg-field px-4 py-3 text-base font-medium focus-visible:ring-4 focus-visible:ring-ring/30 md:text-base"
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
