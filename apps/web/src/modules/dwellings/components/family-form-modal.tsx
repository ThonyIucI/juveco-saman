import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import {
  EFamilyRelationship,
  FAMILY_CONTACT_NAME_LENGTH_MESSAGE,
  FAMILY_CONTACT_NAME_MAX_LENGTH,
  FAMILY_CONTACT_NAME_REQUIRED_MESSAGE,
  FAMILY_CONTACT_PHONE_REQUIRED_MESSAGE,
  FAMILY_HEAD_REQUIRED_MESSAGE,
  FAMILY_NOTE_LENGTH_MESSAGE,
  FAMILY_NOTE_MAX_LENGTH,
  type IFamilyContact,
  type IFamilyResource,
} from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import { type IPhone, phoneError } from "@juveco/shared/phones";
import type { IUserResource } from "@juveco/shared/users";
import { useForm, useStore } from "@tanstack/react-form";
import { useEffect } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import PhoneInput from "@/common/components/phone-input";
import TextField from "@/common/components/text-field";
import { EMPTY_PHONE } from "@/common/utils/person-form";
import { useSaveFamily } from "@/modules/dwellings/hooks/use-save-family";
import UserSearch from "@/modules/users/components/user-search";

const FORM_ID = "family-form";

const phoneSchema = z.object({ countryPrefix: z.string(), number: z.string() });

const formSchema = z
  .object({
    headId: z.string().min(1, FAMILY_HEAD_REQUIRED_MESSAGE),
    contactName: z.string().trim().max(FAMILY_CONTACT_NAME_MAX_LENGTH, FAMILY_CONTACT_NAME_LENGTH_MESSAGE),
    contactPhone: phoneSchema,
    note: z.string().max(FAMILY_NOTE_MAX_LENGTH, FAMILY_NOTE_LENGTH_MESSAGE),
  })
  .superRefine((value, context) => {
    const hasName = value.contactName !== "";
    const hasNumber = value.contactPhone.number.trim() !== "";
    if (hasNumber) {
      const message = phoneError(value.contactPhone.countryPrefix, value.contactPhone.number);
      if (message) {
        context.addIssue({ code: "custom", path: ["contactPhone"], message });
      }
    }
    if (hasNumber && !hasName) {
      context.addIssue({ code: "custom", path: ["contactName"], message: FAMILY_CONTACT_NAME_REQUIRED_MESSAGE });
    }
    if (hasName && !hasNumber) {
      context.addIssue({ code: "custom", path: ["contactPhone"], message: FAMILY_CONTACT_PHONE_REQUIRED_MESSAGE });
    }
  });

type TFamilyFormValues = z.input<typeof formSchema>;

const buildDefaults = (family?: IFamilyResource): TFamilyFormValues => ({
  headId: family?.members.find((member) => member.relationship === EFamilyRelationship.HEAD)?.userId ?? "",
  contactName: family?.contact?.name ?? "",
  contactPhone: family?.contact?.phone ?? EMPTY_PHONE,
  note: family?.note ?? "",
});

const toContact = (name: string, phone: IPhone): IFamilyContact | null => {
  const trimmedName = name.trim();
  const number = phone.number.trim();
  return trimmedName && number ? { name: trimmedName, phone: { countryPrefix: phone.countryPrefix, number } } : null;
};

interface IFamilyFormModalProps {
  open: boolean;
  dwellingId: string;
  /** Sin familia: alta (con su jefe). Con familia: edición del contacto y la nota. */
  family?: IFamilyResource;
  /** Las personas para elegir al jefe. */
  users: IUserResource[];
  /** Una persona creada desde el buscador: la lista de usuarios se entera. */
  onUserCreated: (user: IUserResource) => void;
  onSaved: (dwelling: IDwellingDetailResource) => void;
  onClose: () => void;
}

/**
 * Agregar una familia a la vivienda: se elige o se crea al jefe de hogar. Si el jefe no tiene
 * teléfono aparece el contacto alternativo (a quién pertenece el número), que **nunca bloquea**:
 * puede dejarse vacío. Al editar, el jefe no cambia.
 */
export default function FamilyFormModal({
  open,
  dwellingId,
  family,
  users,
  onUserCreated,
  onSaved,
  onClose,
}: IFamilyFormModalProps) {
  const isEdit = Boolean(family);
  const SaveFamily = useSaveFamily();

  const form = useForm({
    defaultValues: buildDefaults(family),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = { contact: toContact(value.contactName, value.contactPhone), note: value.note.trim() || null };
      const saved = family
        ? await SaveFamily.update(family, payload)
        : await SaveFamily.create(dwellingId, { headId: value.headId, ...payload });
      if (saved) {
        onSaved(saved);
        onClose();
      }
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const headId = useStore(form.store, (state) => state.values.headId);

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(family));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, family]);

  const chosenHead = users.find((user) => user.id === headId) ?? null;
  const currentHead = family?.members.find((member) => member.relationship === EFamilyRelationship.HEAD) ?? null;
  const headPhone = family ? (currentHead?.phone ?? null) : (chosenHead?.phone ?? null);
  /* El contacto alternativo solo hace falta si el jefe no tiene teléfono. */
  const shouldAskContact = Boolean(headId) && headPhone === null;

  return (
    <Modal
      isDirty={isDirty}
      open={open}
      title={isEdit ? "Editar familia" : "Agregar familia"}
      width="lg"
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons
              formId={FORM_ID}
              isSubmitting={isSubmitting}
              label={isEdit ? "Guardar cambios" : "Agregar familia"}
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
          if (!form.state.isSubmitting) {
            form.handleSubmit();
          }
        }}
        className="space-y-4"
      >
        <form.Field name="headId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Jefe(a) de hogar</Label>
              {family && currentHead ? (
                <p className="flex h-control items-center font-medium text-foreground">{fullName(currentHead)}</p>
              ) : (
                <UserSearch
                  id={field.name}
                  users={users}
                  value={chosenHead}
                  isInvalid={field.state.meta.errors.length > 0}
                  onChange={(user) => field.handleChange(user?.id ?? "")}
                  onCreated={onUserCreated}
                />
              )}
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        {shouldAskContact && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              El jefe no tiene teléfono. Si hay un vecino o familiar que reciba los avisos, escribe su número y a quién
              pertenece. Puedes dejarlo vacío.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="contactName">
                {(field) => (
                  <TextField
                    id={field.name}
                    label="A quién pertenece el número"
                    autoComplete="off"
                    maxLength={FAMILY_CONTACT_NAME_MAX_LENGTH}
                    placeholder="Ingresa el nombre del contacto"
                    value={field.state.value}
                    errors={field.state.meta.errors}
                    onBlur={field.handleBlur}
                    onValueChange={field.handleChange}
                  />
                )}
              </form.Field>

              <form.Field name="contactPhone">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Teléfono del contacto</Label>
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
            </div>
          </div>
        )}

        <form.Field name="note">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nota (opcional)</Label>
              <Textarea
                id={field.name}
                name={field.name}
                rows={3}
                maxLength={FAMILY_NOTE_MAX_LENGTH}
                placeholder="Ingresa una nota"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="min-h-24 rounded-lg border border-field-border bg-field px-4 py-3 text-sm font-medium focus-visible:ring-4 focus-visible:ring-ring/30 md:text-sm dark:bg-field"
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
