import { Label } from "@juveco/ui/components/label";
import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import {
  EFamilyRelationship,
  type IFamilyMemberResource,
  NEW_FAMILY,
  formerHeadReviewMessage,
} from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";
import { useForm, useStore } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import PhoneInput from "@/common/components/phone-input";
import { type IPersonInitialValues, buildPersonDefaults } from "@/common/utils/person-form";
import MemberFamilyFields from "@/modules/dwellings/components/member-family-fields";
import { useSaveMember } from "@/modules/dwellings/hooks/use-save-member";
import {
  type IMemberPayloadOptions,
  type TMemberFormValues,
  buildEditMemberDefaults,
  buildMemberFormSchema,
  buildNewMemberDefaults,
  findTargetFamily,
  headOf,
  toMemberCreatePayload,
  toMemberUpdatePayload,
} from "@/modules/dwellings/utils/member-form";
import { PersonCensusFields, PersonNameFields } from "@/modules/users/components/person-fields";
import UserSearch from "@/modules/users/components/user-search";
import { useGetUser } from "@/modules/users/hooks/use-get-user";
import { usePersonFormMatches } from "@/modules/users/hooks/use-person-form-matches";

const FORM_ID = "member-form";
const SEARCH_ID = "member-search";
const FIRST_NAME_ID = "firstName";

const focusById = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());

interface IMemberFormModalProps {
  open: boolean;
  /** La vivienda abierta, con sus familias; `null` con la modal cerrada. */
  dwelling: IDwellingDetailResource | null;
  /** Sin integrante: alta. Con integrante: edición. */
  member?: IFamilyMemberResource;
  /** Las personas para buscar. */
  users: IUserResource[];
  onSaved: (dwelling: IDwellingDetailResource) => void;
  onClose: () => void;
}

/**
 * Agregar o editar a un integrante de la vivienda. Arriba, «¿Ya está registrado?»: al elegir a
 * alguien, sus datos llenan los campos de abajo (que se pueden corregir); si no se elige a nadie,
 * se crea una persona nueva con esos campos. La familia se crea sola con el primer integrante;
 * una segunda familia se elige solo si hace falta.
 */
export default function MemberFormModal({ open, dwelling, member, users, onSaved, onClose }: IMemberFormModalProps) {
  const isEdit = Boolean(member);
  const families = dwelling?.families ?? [];
  const memberFamily = member ? (families.find((family) => family.members.some((item) => item.id === member.id)) ?? null) : null;
  const SaveMember = useSaveMember();
  const GetUser = useGetUser();
  const navigate = useNavigate();
  const keepOpenRef = useRef(false);
  const detailsControllerRef = useRef<AbortController | null>(null);
  const [chosenUser, setChosenUser] = useState<IUserResource | null>(null);
  /* Los datos del censo de la persona (elegida o editada) llegan aparte: hasta entonces no se mandan. */
  const [areDetailsLoaded, setAreDetailsLoaded] = useState(false);
  const [isFamilyPickerOpen, setIsFamilyPickerOpen] = useState(false);

  const form = useForm({
    defaultValues: buildNewMemberDefaults({ isFirst: families.length === 0 }),
    validators: { onSubmit: buildMemberFormSchema(!isEdit && families.length >= 2) },
    onSubmit: async ({ value }) => {
      if (!dwelling) {
        return;
      }
      if (documentMatch) {
        toast.error(`«${fullName(documentMatch)}» ya tiene ese DNI.`);
        return;
      }
      if (member && !areDetailsLoaded) {
        toast.error("Espera a que carguen los datos de la persona.");
        return;
      }
      const isNewPerson = !member && !value.userId;
      const options: IMemberPayloadOptions = {
        canSendPerson: isNewPerson || !member || areDetailsLoaded,
        canSendDetails: isNewPerson || areDetailsLoaded,
      };
      const name = fullName({
        firstName: value.firstName.trim(),
        paternalLastName: value.paternalLastName.trim() || null,
        maternalLastName: value.maternalLastName.trim() || null,
      });
      const saved = member
        ? await SaveMember.update(dwelling.id, member.id, toMemberUpdatePayload(value, options), name)
        : await SaveMember.create(dwelling.id, toMemberCreatePayload(value, options), name);
      if (!saved) {
        keepOpenRef.current = false;
        return;
      }
      warnFormerHead(value, dwelling);
      onSaved(saved);
      if (keepOpenRef.current) {
        keepOpenRef.current = false;
        prepareNext(value, dwelling, saved);
        return;
      }
      onClose();
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const familyChoice = useStore(form.store, (state) => state.values.familyChoice);
  const userId = useStore(form.store, (state) => state.values.userId);
  const { documentMatch, nameMatches } = usePersonFormMatches(form, userId || undefined);

  /* Al pasar la jefatura a otra persona, el jefe anterior queda como «Otro pariente»: se avisa. */
  const warnFormerHead = (value: TMemberFormValues, current: IDwellingDetailResource) => {
    const target = member ? memberFamily : findTargetFamily(current.families, value.familyChoice);
    const formerHead = value.isHead ? headOf(target) : undefined;
    if (formerHead && formerHead.userId !== (member?.userId ?? value.userId)) {
      toast.info(formerHeadReviewMessage(fullName(formerHead)));
    }
  };

  /* «Guardar y agregar otro»: campos limpios, en la misma familia, y el foco en el buscador. */
  const prepareNext = (value: TMemberFormValues, previous: IDwellingDetailResource, saved: IDwellingDetailResource) => {
    const previousIds = new Set(previous.families.map((family) => family.id));
    const createdFamily = saved.families.find((family) => !previousIds.has(family.id));
    const nextFamilyChoice = createdFamily?.id ?? (value.familyChoice === NEW_FAMILY ? "" : value.familyChoice);
    detailsControllerRef.current?.abort();
    form.reset(buildNewMemberDefaults({ isFirst: false, familyChoice: nextFamilyChoice }));
    setChosenUser(null);
    setAreDetailsLoaded(false);
    focusById(SEARCH_ID);
  };

  /* Pide los datos del censo de la persona y los pone en el formulario sin pisar el resto. */
  const loadPersonDetails = async (id: string) => {
    detailsControllerRef.current?.abort();
    const controller = new AbortController();
    detailsControllerRef.current = controller;
    const detailed = await GetUser.handler(id, controller.signal);
    if (controller.signal.aborted || !detailed) {
      return;
    }
    form.reset({ ...form.state.values, ...buildPersonDefaults(detailed) });
    setAreDetailsLoaded(true);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setChosenUser(null);
    setAreDetailsLoaded(false);
    setIsFamilyPickerOpen(false);
    if (!member) {
      form.reset(buildNewMemberDefaults({ isFirst: families.length === 0 }));
      return;
    }
    form.reset(buildEditMemberDefaults(member, memberFamily));
    loadPersonDetails(member.userId);
    return () => detailsControllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  /* Elegir a alguien llena los campos con sus datos; quitarlo los deja vacíos. */
  const handleChoose = (user: IUserResource | null) => {
    detailsControllerRef.current?.abort();
    setChosenUser(user);
    setAreDetailsLoaded(false);
    form.reset({
      ...form.state.values,
      ...buildPersonDefaults(user ?? undefined),
      userId: user?.id ?? "",
    });
    if (user) {
      loadPersonDetails(user.id);
    }
  };

  /* «Crear «Ana»» en el buscador: lo escrito pasa a los campos de abajo. */
  const handleStartCreate = (values: IPersonInitialValues) => {
    if (values.firstName !== undefined) {
      form.setFieldValue("firstName", values.firstName);
    }
    if (values.phone) {
      form.setFieldValue("phone", values.phone);
    }
    focusById(FIRST_NAME_ID);
  };

  /* «Ver persona»: lleva a su registro en Usuarios. */
  const viewMatch = (id: string) => {
    onClose();
    navigate({ to: "/usuarios", search: { usuario: id } });
  };

  /* Quienes ya están en esta vivienda no se ofrecen; en otras viviendas, lo frena la API. */
  const dwellingUserIds = new Set(families.flatMap((family) => family.members.map((item) => item.userId)));
  const available = users.filter((user) => !dwellingUserIds.has(user.id));

  const isMemberHead = member?.relationship === EFamilyRelationship.HEAD;
  const isFirstOfDwelling = !isEdit && families.length === 0;
  const isNewFamily = !isEdit && familyChoice === NEW_FAMILY;
  const isHeadLocked = isFirstOfDwelling || isNewFamily || isMemberHead;
  const headHint = isFirstOfDwelling
    ? "Es el primero de la casa: queda como jefe(a) de hogar."
    : isNewFamily
      ? "Una familia nueva empieza con su jefe(a)."
      : isMemberHead
        ? "Para cambiar al jefe(a), prende la estrella en otra persona."
        : null;

  return (
    <Modal
      isDirty={isDirty}
      open={open}
      title={isEdit ? "Editar integrante" : "Nuevo integrante"}
      width="lg"
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons
              formId={FORM_ID}
              isSubmitting={isSubmitting}
              label="Guardar"
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
        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor={SEARCH_ID}>¿Ya está registrado?</Label>
            <UserSearch
              id={SEARCH_ID}
              users={available}
              value={chosenUser}
              onChange={handleChoose}
              onStartCreate={handleStartCreate}
            />
            <p className="text-sm text-muted-foreground">
              Búscalo por DNI o nombre. Si no está, escribe sus datos abajo.
            </p>
          </div>
        )}

        <div className="space-y-4 border-t border-border pt-4">
          <p className="text-sm font-semibold text-foreground">Datos de la persona</p>

          <PersonNameFields form={form} />
          <PersonCensusFields
            form={form}
            documentMatch={documentMatch}
            nameMatches={nameMatches}
            onViewMatch={viewMatch}
          />

          <form.Field name="phone">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Celular (opcional)</Label>
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

        <div className="space-y-4 border-t border-border pt-4">
          <MemberFamilyFields
            form={form}
            families={families}
            isEdit={isEdit}
            isHeadLocked={isHeadLocked}
            headHint={headHint}
            isFamilyPickerOpen={isFamilyPickerOpen}
            onOpenFamilyPicker={() => setIsFamilyPickerOpen(true)}
          />
        </div>
      </form>
    </Modal>
  );
}
