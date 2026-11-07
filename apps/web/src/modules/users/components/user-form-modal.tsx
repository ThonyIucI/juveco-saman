import { Button } from "@juveco/ui/components/button";
import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import type { IUserResource } from "@juveco/shared/users";
import { NEIGHBORHOODS } from "@juveco/shared/neighborhoods";
import { PERSON_NAME_MAX_LENGTH, PERSON_NOTE_MAX_LENGTH } from "@juveco/shared/people";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import PhoneInput from "@/common/components/phone-input";
import Select, { type IOption } from "@/common/components/select";
import TextField from "@/common/components/text-field";
import {
  type IPersonInitialValues,
  USERNAME_INPUT_MAX_LENGTH,
  buildPersonDefaults,
  personFormSchema,
  toPersonPayload,
} from "@/common/utils/person-form";
import { useCreateUser } from "@/modules/users/hooks/use-create-user";
import { useUpdateUser } from "@/modules/users/hooks/use-update-user";

const FORM_ID = "user-form";

/* Los barrios salen de las constantes, nunca de una petición. */
const NEIGHBORHOOD_OPTIONS: IOption[] = NEIGHBORHOODS.map(({ id, name }) => ({ value: id, label: name }));

interface IUserFormModalProps {
  open: boolean;
  /** Sin usuario: alta. Con usuario: edición. */
  user?: IUserResource;
  /** Solo al crear: lo que se escribió en el buscador. */
  initialValues?: IPersonInitialValues;
  onSaved: (user: IUserResource) => void;
  onClose: () => void;
}

/** Alta y edición de una persona: nombres, apellidos, barrio, WhatsApp y una nota. */
export default function UserFormModal({
  open,
  user,
  initialValues,
  onSaved,
  onClose,
}: IUserFormModalProps) {
  const isEdit = Boolean(user);
  const CreateUser = useCreateUser();
  const UpdateUser = useUpdateUser();

  const form = useForm({
    defaultValues: buildPersonDefaults(user),
    validators: { onSubmit: personFormSchema },
    onSubmit: async ({ value }) => {
      const payload = toPersonPayload(value);
      const saved = user
        ? await UpdateUser.handler(user.id, payload)
        : await CreateUser.handler(payload);

      if (saved) {
        onSaved(saved);
        onClose();
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(buildPersonDefaults(user, initialValues));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  return (
    <Modal
      open={open}
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
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
                {isEdit ? "Guardar cambios" : "Agregar usuario"}
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
          <form.Field name="firstName">
            {(field) => (
              <TextField
                id={field.name}
                label="Nombres"
                autoCapitalize="words"
                maxLength={PERSON_NAME_MAX_LENGTH}
                placeholder="Ej. Ana María"
                value={field.state.value}
                errors={field.state.meta.errors}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
              />
            )}
          </form.Field>

          <form.Field name="lastName">
            {(field) => (
              <TextField
                id={field.name}
                label="Apellidos (opcional)"
                autoCapitalize="words"
                maxLength={PERSON_NAME_MAX_LENGTH}
                placeholder="Ej. Pérez Ruiz"
                value={field.state.value}
                errors={field.state.meta.errors}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
              />
            )}
          </form.Field>
        </div>

        <form.Field name="neighborhoodId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Barrio (opcional)</Label>
              <Select
                inputId={field.name}
                options={NEIGHBORHOOD_OPTIONS}
                placeholder="Elige el barrio"
                isClearable
                isSearchable={false}
                isInvalid={field.state.meta.errors.length > 0}
                value={NEIGHBORHOOD_OPTIONS.find((option) => option.value === field.state.value) ?? null}
                onBlur={field.handleBlur}
                onChange={(option) => field.handleChange(option?.value ?? "")}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="phone">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Número de WhatsApp (opcional)</Label>
              <PhoneInput
                id={field.name}
                value={field.state.value}
                isInvalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="whatsappUsername">
          {(field) => (
            <TextField
              id={field.name}
              label="Usuario de WhatsApp (opcional)"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={USERNAME_INPUT_MAX_LENGTH}
              placeholder="Ej. @ana.pe"
              value={field.state.value}
              errors={field.state.meta.errors}
              onBlur={field.handleBlur}
              onValueChange={field.handleChange}
            />
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
                placeholder="Ej. Paga el domingo."
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
