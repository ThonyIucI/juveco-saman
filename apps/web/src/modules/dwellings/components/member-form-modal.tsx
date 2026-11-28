import { Label } from "@juveco/ui/components/label";
import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import {
  EFamilyRelationship,
  FAMILY_MEMBER_REQUIRED_MESSAGE,
  FAMILY_RELATIONSHIP_INVALID_MESSAGE,
  type IFamilyMemberResource,
  type IFamilyResource,
  MEMBER_RELATIONSHIPS,
  familyRelationshipLabels,
  isFamilyRelationship,
} from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";
import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useRef } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import Select, { type IOption } from "@/common/components/select";
import { useSaveMember } from "@/modules/dwellings/hooks/use-save-member";
import UserSearch from "@/modules/users/components/user-search";

const FORM_ID = "member-form";
/* El parentesco que más se repite: ahorra un clic al cargar a los hijos. */
const DEFAULT_RELATIONSHIP = EFamilyRelationship.CHILD;

const RELATIONSHIP_OPTIONS: IOption[] = MEMBER_RELATIONSHIPS.map((relationship) => ({
  value: relationship,
  label: familyRelationshipLabels[relationship],
}));

const formSchema = z.object({
  userId: z.string().min(1, FAMILY_MEMBER_REQUIRED_MESSAGE),
  relationship: z.string().refine(
    (value) => isFamilyRelationship(value) && value !== EFamilyRelationship.HEAD,
    FAMILY_RELATIONSHIP_INVALID_MESSAGE,
  ),
});

type TMemberFormValues = z.input<typeof formSchema>;

const buildDefaults = (member?: IFamilyMemberResource): TMemberFormValues => ({
  userId: member?.userId ?? "",
  relationship: member?.relationship ?? DEFAULT_RELATIONSHIP,
});

interface IMemberFormModalProps {
  open: boolean;
  /** La familia a la que se agrega; `null` con la modal cerrada. */
  family: IFamilyResource | null;
  /** Sin integrante: alta. Con integrante: solo se cambia su parentesco. */
  member?: IFamilyMemberResource;
  /** Las personas para elegir. */
  users: IUserResource[];
  /** Una persona creada desde el buscador: la lista de usuarios se entera. */
  onUserCreated: (user: IUserResource) => void;
  onSaved: (dwelling: IDwellingDetailResource) => void;
  onClose: () => void;
}

/**
 * Agregar un integrante a la familia (buscador + parentesco, con «Guardar y agregar otro») o
 * cambiarle el parentesco. Quien ya está en otra familia lo rechaza la API, diciendo dónde está.
 */
export default function MemberFormModal({
  open,
  family,
  member,
  users,
  onUserCreated,
  onSaved,
  onClose,
}: IMemberFormModalProps) {
  const isEdit = Boolean(member);
  const SaveMember = useSaveMember();
  const keepOpenRef = useRef(false);

  const form = useForm({
    defaultValues: buildDefaults(member),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      if (!family || !isFamilyRelationship(value.relationship)) {
        return;
      }
      const person = users.find((user) => user.id === value.userId);
      const saved = member
        ? await SaveMember.update(family, member, { relationship: value.relationship })
        : await SaveMember.create(
            family,
            { userId: value.userId, relationship: value.relationship },
            person ? fullName(person) : "Persona",
          );
      if (!saved) {
        keepOpenRef.current = false;
        return;
      }
      onSaved(saved);
      if (keepOpenRef.current) {
        keepOpenRef.current = false;
        form.reset(buildDefaults());
        return;
      }
      onClose();
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(member));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  /* Quienes ya están en esta familia no se ofrecen; en otras familias, lo frena la API. */
  const familyUserIds = new Set(family?.members.map((familyMember) => familyMember.userId) ?? []);
  const available = users.filter((user) => !familyUserIds.has(user.id));

  return (
    <Modal
      isDirty={isDirty}
      open={open}
      title={isEdit ? "Editar parentesco" : "Agregar integrante"}
      subtitle={member ? fullName(member) : undefined}
      width="lg"
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons
              formId={FORM_ID}
              isSubmitting={isSubmitting}
              label={isEdit ? "Guardar cambios" : "Guardar"}
              continueLabel="Guardar y agregar otro"
              onSubmitAndContinue={
                isEdit
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
          keepOpenRef.current = false;
          if (!form.state.isSubmitting) {
            form.handleSubmit();
          }
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {!isEdit && (
            <form.Field name="userId">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Persona</Label>
                  <UserSearch
                    id={field.name}
                    users={available}
                    value={users.find((user) => user.id === field.state.value) ?? null}
                    isInvalid={field.state.meta.errors.length > 0}
                    onChange={(user) => field.handleChange(user?.id ?? "")}
                    onCreated={onUserCreated}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>
          )}

          <form.Field name="relationship">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Parentesco con el jefe(a)</Label>
                <Select
                  inputId={field.name}
                  options={RELATIONSHIP_OPTIONS}
                  placeholder="Elige el parentesco"
                  isSearchable={false}
                  isInvalid={field.state.meta.errors.length > 0}
                  value={RELATIONSHIP_OPTIONS.find((option) => option.value === field.state.value) ?? null}
                  onBlur={field.handleBlur}
                  onChange={(option) => field.handleChange(option?.value ?? "")}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </div>
      </form>
    </Modal>
  );
}
