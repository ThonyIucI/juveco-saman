import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import {
  EPrizeOrigin,
  type IActivityPrizeInput,
  type IActivityPrizeResource,
  PRIZE_COST_REQUIRED_MESSAGE,
  PRIZE_DONOR_REQUIRED_MESSAGE,
  PRIZE_NAME_LENGTH_MESSAGE,
  PRIZE_NAME_MAX_LENGTH,
  PRIZE_NAME_REQUIRED_MESSAGE,
  type TPrizeOrigin,
  prizeOriginLabels,
} from "@juveco/shared/activity-prizes";
import { INVALID_SOLES_MESSAGE, parseSoles, toSolesInput } from "@juveco/shared/money";
import { PERSON_NOTE_LENGTH_MESSAGE, PERSON_NOTE_MAX_LENGTH } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";
import { useForm, useStore } from "@tanstack/react-form";
import { Gift, ShoppingBag } from "lucide-react";
import { useEffect, useRef } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import OptionCards, { type IOptionCard } from "@/common/components/option-cards";
import SolesInput from "@/common/components/soles-input";
import TextField from "@/common/components/text-field";
import { useCreateActivityPrize } from "@/modules/activities/hooks/use-create-activity-prize";
import { useUpdateActivityPrize } from "@/modules/activities/hooks/use-update-activity-prize";
import UserSearch from "@/modules/users/components/user-search";

const FORM_ID = "prize-form";

const ORIGIN_OPTIONS: IOptionCard<TPrizeOrigin>[] = [
  { value: EPrizeOrigin.DONATED, label: prizeOriginLabels.DONATED, icon: Gift },
  { value: EPrizeOrigin.PURCHASED, label: prizeOriginLabels.PURCHASED, icon: ShoppingBag },
];

/* Donado pide donante; comprado, costo. Lo del otro origen no se valida ni se manda. */
const formSchema = z
  .object({
    name: z.string().trim().min(1, PRIZE_NAME_REQUIRED_MESSAGE).max(PRIZE_NAME_MAX_LENGTH, PRIZE_NAME_LENGTH_MESSAGE),
    origin: z.enum([EPrizeOrigin.DONATED, EPrizeOrigin.PURCHASED]),
    donorId: z.string(),
    cost: z.string(),
    note: z.string().max(PERSON_NOTE_MAX_LENGTH, PERSON_NOTE_LENGTH_MESSAGE),
  })
  .superRefine((value, context) => {
    if (value.origin === EPrizeOrigin.DONATED && !value.donorId) {
      context.addIssue({ code: "custom", path: ["donorId"], message: PRIZE_DONOR_REQUIRED_MESSAGE });
    }
    if (value.origin === EPrizeOrigin.PURCHASED) {
      if (!value.cost.trim()) {
        context.addIssue({ code: "custom", path: ["cost"], message: PRIZE_COST_REQUIRED_MESSAGE });
      } else if (parseSoles(value.cost) === null) {
        context.addIssue({ code: "custom", path: ["cost"], message: INVALID_SOLES_MESSAGE });
      }
    }
  });

type TPrizeFormValues = z.input<typeof formSchema>;

const buildDefaults = (prize?: IActivityPrizeResource): TPrizeFormValues => ({
  name: prize?.name ?? "",
  origin: prize?.origin ?? EPrizeOrigin.DONATED,
  donorId: prize?.donor?.id ?? "",
  cost: prize?.cost === null || prize?.cost === undefined ? "" : toSolesInput(prize.cost),
  note: prize?.note ?? "",
});

const toPayload = (value: TPrizeFormValues): IActivityPrizeInput => {
  const isDonated = value.origin === EPrizeOrigin.DONATED;
  return {
    name: value.name.trim(),
    origin: value.origin,
    donorId: isDonated ? value.donorId : null,
    cost: isDonated ? null : parseSoles(value.cost),
    note: value.note.trim() || null,
  };
};

interface IPrizeFormModalProps {
  open: boolean;
  activityId: string;
  /** Sin premio: nuevo. Con premio: edición. */
  prize?: IActivityPrizeResource;
  /** Las personas para elegir al donante. */
  users: IUserResource[];
  onUserCreated: (user: IUserResource) => void;
  onSaved: (prize: IActivityPrizeResource) => void;
  onClose: () => void;
}

/** Un premio: nombre, si fue donado (y por quién) o comprado (y cuánto costó), y una nota. */
export default function PrizeFormModal({
  open,
  activityId,
  prize,
  users,
  onUserCreated,
  onSaved,
  onClose,
}: IPrizeFormModalProps) {
  const CreateActivityPrize = useCreateActivityPrize();
  const UpdateActivityPrize = useUpdateActivityPrize();

  /* «Crear y seguir creando»: guarda y deja el formulario abierto, vacío, para el siguiente. */
  const keepOpenRef = useRef(false);

  const form = useForm({
    defaultValues: buildDefaults(prize),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = toPayload(value);
      const saved = prize
        ? await UpdateActivityPrize.handler(prize, payload)
        : await CreateActivityPrize.handler(activityId, payload);
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
      form.reset(buildDefaults(prize));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prize]);

  return (
    <Modal
      isDirty={isDirty}
      open={open}
      title={prize ? "Editar premio" : "Nuevo premio"}
      width="lg"
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons
              formId={FORM_ID}
              isSubmitting={isSubmitting}
              label={prize ? "Guardar cambios" : "Crear"}
              onSubmitAndContinue={
                prize
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
          <form.Field name="name">
            {(field) => (
              <TextField
                id={field.name}
                label="Premio"
                autoComplete="off"
                maxLength={PRIZE_NAME_MAX_LENGTH}
                placeholder="Ingresa el premio"
                value={field.state.value}
                errors={field.state.meta.errors}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
              />
            )}
          </form.Field>

          <form.Field name="origin">
            {(field) => (
              <div className="space-y-2">
                <Label id="prize-origin-label">Cómo se consiguió</Label>
                <OptionCards
                  labelledBy="prize-origin-label"
                  options={ORIGIN_OPTIONS}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe selector={(state) => state.values.origin}>
          {(origin) =>
            origin === EPrizeOrigin.DONATED ? (
              <form.Field name="donorId">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Lo donó</Label>
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
            ) : (
              <form.Field name="cost">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Costo</Label>
                    <SolesInput
                      id={field.name}
                      placeholder="Ingresa cuánto costó"
                      isInvalid={field.state.meta.errors.length > 0}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>
            )
          }
        </form.Subscribe>

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
