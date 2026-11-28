import { Label } from "@juveco/ui/components/label";
import { Skeleton } from "@juveco/ui/components/skeleton";
import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import {
  EFamilyRelationship,
  FAMILY_CONTACT_NAME_MAX_LENGTH,
  type IFamilyMemberResource,
  NEW_FAMILY,
  familyNameOf,
  formerHeadReviewMessage,
} from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import type { IUserDetailResource } from "@juveco/shared/users";
import { useForm, useStore } from "@tanstack/react-form";
import { CircleCheck, Loader2, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import FormTabs from "@/common/components/form-tabs";
import Modal from "@/common/components/modal";
import PhoneInput from "@/common/components/phone-input";
import Select, { type IOption } from "@/common/components/select";
import TextField from "@/common/components/text-field";
import { buildPersonDefaults } from "@/common/utils/person-form";
import MemberFamilyFields from "@/modules/dwellings/components/member-family-fields";
import { useSaveMember } from "@/modules/dwellings/hooks/use-save-member";
import {
  DEFAULT_RELATIONSHIP,
  EMPTY_MEMBER_PERSON,
  type TMemberPersonValues,
  buildEditMemberDefaults,
  contactOf,
  headOf,
  memberPersonSchema,
  toMemberUpdatePayload,
} from "@/modules/dwellings/utils/member-form";
import {
  NameMatchesWarning,
  PersonBirthDateField,
  PersonConditionFields,
  PersonDocumentField,
  PersonGenderField,
  PersonNameFields,
} from "@/modules/users/components/person-fields";
import { useDocumentLookup } from "@/modules/users/hooks/use-document-lookup";
import { useGetUser } from "@/modules/users/hooks/use-get-user";
import { usePersonFormMatches } from "@/modules/users/hooks/use-person-form-matches";

const FORM_ID = "member-form";
const DOCUMENT_INPUT_ID = "documentNumber";
const HEAD_LOCKED_HINT = "Para cambiar al jefe(a), marca la estrella en otra persona.";
const NAME_FIELDS = ["firstName", "paternalLastName", "maternalLastName"] as const;

type TTab = "main" | "extra";
const MAIN_FIELDS = [
  "documentNumber",
  "firstName",
  "paternalLastName",
  "maternalLastName",
  "birthDate",
  "gender",
  "phone",
  "relationship",
] as const;

const focusById = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());

interface IMemberFormModalProps {
  open: boolean;
  /** La vivienda abierta, con sus familias; `null` mientras carga. */
  dwelling: IDwellingDetailResource | null;
  /** Sin integrante: alta. Con integrante: edición. */
  member: IFamilyMemberResource | null;
  onSaved: (dwelling: IDwellingDetailResource) => void;
  onClose: () => void;
}

/**
 * Alta o edición de un integrante en **una sola modal densa**, como «Nuevo cliente» de id-pos:
 * pestañas Principales / Adicionales y campos en dos columnas.
 *
 * El DNI va primero y hace de buscador: si la persona ya está registrada, se completan sus datos
 * y se vincula (no se crea otra); si no, se autocompletan los nombres con la consulta de DNI
 * (cuando esté conectada). Al crear, «Guardar y seguir agregando» deja la modal lista para el
 * siguiente de la casa.
 */
export default function MemberFormModal({ open, dwelling, member, onSaved, onClose }: IMemberFormModalProps) {
  const isEdit = member !== null;
  const families = dwelling?.families ?? [];
  const SaveMember = useSaveMember();
  const GetUser = useGetUser();
  const [tab, setTab] = useState<TTab>("main");
  const [isLoading, setIsLoading] = useState(false);
  /* Al crear: la persona ya registrada que se encontró por su DNI (se vincula, no se crea). */
  const [linked, setLinked] = useState<IUserDetailResource | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  /* «» = la única familia (o una nueva si no hay); un id; o `NEW_FAMILY`. */
  const [familyChoice, setFamilyChoice] = useState("");
  const [isFamilyPickerOpen, setIsFamilyPickerOpen] = useState(false);
  const continueRef = useRef(false);

  const memberFamily = member
    ? (families.find((family) => family.members.some((item) => item.id === member.id)) ?? null)
    : null;
  const isMemberHead = member?.relationship === EFamilyRelationship.HEAD;
  /* Una familia sin integrantes necesita jefe: el primero lo es sí o sí. */
  const isNewFamily = !isEdit && (families.length === 0 || familyChoice === NEW_FAMILY);
  const isHeadLocked = isEdit ? isMemberHead : isNewFamily;

  const form = useForm({
    defaultValues: EMPTY_MEMBER_PERSON,
    validators: { onSubmit: memberPersonSchema },
    onSubmit: async ({ value }) => {
      const isSaved = await save(value);
      if (!isSaved) {
        return;
      }
      if (continueRef.current) {
        startNext();
        return;
      }
      onClose();
    },
    onSubmitInvalid: () => {
      const hasMainErrors = MAIN_FIELDS.some((name) => (form.getFieldMeta(name)?.errors.length ?? 0) > 0);
      setTab(hasMainErrors ? "main" : "extra");
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const documentNumber = useStore(form.store, (state) => state.values.documentNumber);
  const exceptUserId = member?.userId ?? linked?.id;
  const { documentMatch, nameMatches } = usePersonFormMatches(form, exceptUserId);
  const lookup = useDocumentLookup(linked ? "" : documentNumber);

  const resetTo = (values: TMemberPersonValues) => {
    form.reset(values);
    setTab("main");
    focusById(DOCUMENT_INPUT_ID);
  };

  const emptyValues = (isHead: boolean): TMemberPersonValues => ({ ...EMPTY_MEMBER_PERSON, isHead });

  /* Al abrir: alta en blanco; edición, con los datos del censo de la persona (se piden primero). */
  useEffect(() => {
    if (!open) {
      return;
    }
    setLinked(null);
    setFamilyChoice("");
    setIsFamilyPickerOpen(false);
    if (!member) {
      resetTo(emptyValues(families.length === 0));
      return;
    }
    setIsLoading(true);
    const controller = new AbortController();
    GetUser.handler(member.userId, controller.signal).then((detailed) => {
      if (controller.signal.aborted) {
        return;
      }
      setIsLoading(false);
      if (!detailed) {
        onClose();
        return;
      }
      resetTo(buildEditMemberDefaults(member, memberFamily, detailed));
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  /*
    Al crear, el DNI busca: si ya hay alguien registrado con ese DNI, se traen sus datos y se
    vincula a esa persona. Si después se cambia el DNI por otro, se desvincula.
  */
  useEffect(() => {
    if (isEdit || !documentMatch || linked?.id === documentMatch.id) {
      return;
    }
    const controller = new AbortController();
    setIsLinking(true);
    GetUser.handler(documentMatch.id, controller.signal).then((detailed) => {
      if (controller.signal.aborted) {
        return;
      }
      setIsLinking(false);
      if (!detailed) {
        return;
      }
      const current = form.state.values;
      setLinked(detailed);
      form.reset({ ...current, ...buildPersonDefaults(detailed) }, { keepDefaultValues: true });
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentMatch, isEdit]);

  useEffect(() => {
    if (linked && documentNumber !== (linked.details.documentNumber ?? "")) {
      setLinked(null);
    }
  }, [documentNumber, linked]);

  /* La consulta de DNI (cuando se conecte) llena solo los nombres que estén vacíos. */
  useEffect(() => {
    if (!lookup) {
      return;
    }
    for (const name of NAME_FIELDS) {
      if (form.getFieldValue(name) === "") {
        form.setFieldValue(name, lookup[name]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookup]);

  /* Al pasar la jefatura a otra persona, el jefe anterior queda como «Otro pariente»: se avisa. */
  const warnFormerHead = (value: TMemberPersonValues) => {
    const targetFamily = isEdit ? memberFamily : familyChoice ? families.find((f) => f.id === familyChoice) : families[0];
    const formerHead = value.isHead && !isMemberHead && !isNewFamily ? headOf(targetFamily ?? null) : undefined;
    if (formerHead) {
      toast.info(formerHeadReviewMessage(fullName(formerHead)));
    }
  };

  const save = async (value: TMemberPersonValues): Promise<boolean> => {
    if (!dwelling) {
      return false;
    }
    /* En edición, un DNI que ya es de otra persona no se guarda. */
    if (isEdit && documentMatch) {
      setTab("main");
      toast.error(`«${fullName(documentMatch)}» ya tiene ese DNI.`);
      return false;
    }
    const name = fullName({
      firstName: value.firstName.trim(),
      paternalLastName: value.paternalLastName.trim() || null,
      maternalLastName: value.maternalLastName.trim() || null,
    });
    const payload = toMemberUpdatePayload(value);
    const saved = member
      ? await SaveMember.update(dwelling.id, member.id, payload, name)
      : await SaveMember.create(
          dwelling.id,
          { ...payload, userId: linked?.id, familyId: familyChoice || undefined, contact: contactOf(value) },
          name,
        );
    if (!saved) {
      return false;
    }
    warnFormerHead(value);
    onSaved(saved);
    return true;
  };

  /* «Guardar y seguir agregando»: la misma familia, la estrella ya no hace falta. */
  const startNext = () => {
    continueRef.current = false;
    setLinked(null);
    if (familyChoice === NEW_FAMILY) {
      setFamilyChoice("");
    }
    resetTo({ ...emptyValues(false), relationship: DEFAULT_RELATIONSHIP });
  };

  const submitAndContinue = () => {
    continueRef.current = true;
    form.handleSubmit();
  };

  const familyOptions: IOption[] = [
    ...families.map((family) => ({ value: family.id, label: familyNameOf(headOf(family)) })),
    { value: NEW_FAMILY, label: "Nueva familia" },
  ];
  const isFamilyPickerShown = !isEdit && (families.length >= 2 || isFamilyPickerOpen);

  const changeFamily = (choice: string) => {
    setFamilyChoice(choice);
    form.setFieldValue("isHead", choice === NEW_FAMILY);
  };

  return (
    <Modal
      isDirty={isDirty}
      open={open}
      title={isEdit ? "Editar integrante" : "Nuevo integrante"}
      subtitle={dwelling?.code}
      width="lg"
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons
              formId={FORM_ID}
              isSubmitting={isSubmitting}
              label={isEdit ? "Guardar cambios" : "Guardar"}
              continueLabel="Guardar y seguir agregando"
              onSubmitAndContinue={isEdit ? undefined : submitAndContinue}
            />
          )}
        </form.Subscribe>
      }
    >
      <FormTabs
        tabs={[
          { value: "main", label: "Principales" },
          { value: "extra", label: "Adicionales" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {isLoading ? (
        <div aria-busy="true" aria-label="Cargando" className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-control w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <form
          id={FORM_ID}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!form.state.isSubmitting) {
              continueRef.current = false;
              form.handleSubmit();
            }
          }}
        >
          {/* Principales: DNI primero (busca y autocompleta), nombres, nacimiento, género, celular y su lugar en la familia. */}
          <div hidden={tab !== "main"} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <PersonDocumentField form={form} documentMatch={isEdit ? documentMatch : null} />
              {isLinking && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Buscando sus datos…
                </p>
              )}
              {linked && !isLinking && (
                <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <CircleCheck aria-hidden className="size-4 shrink-0" />
                  Ya registrado: se completaron sus datos.
                </p>
              )}
            </div>

            <PersonNameFields form={form} isFlat />
            <PersonBirthDateField form={form} />
            <PersonGenderField form={form} />

            <form.Field name="phone">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Celular (opcional)</Label>
                  <PhoneInput
                    id={field.name}
                    icon={Phone}
                    value={field.state.value}
                    isInvalid={field.state.meta.errors.length > 0}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <div className="space-y-4 sm:col-span-2">
              <NameMatchesWarning nameMatches={nameMatches} />
              <MemberFamilyFields
                form={form}
                isHeadLocked={isHeadLocked}
                headHint={isEdit && isMemberHead ? HEAD_LOCKED_HINT : null}
              />
            </div>
          </div>

          {/* Adicionales: prioridad, contacto alternativo y, si hace falta, otra familia de la casa. */}
          <div hidden={tab !== "extra"} className="space-y-5">
            <PersonConditionFields form={form} />

            <form.Subscribe selector={(state) => state.values.isHead && state.values.phone.number.trim() === ""}>
              {(isContactAsked) =>
                isContactAsked && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">
                      El jefe(a) no tiene celular. Si un vecino o familiar recibe los avisos, escribe su número y a
                      quién pertenece. Puedes dejarlo vacío.
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
                              icon={Phone}
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
                )
              }
            </form.Subscribe>

            {!isEdit && families.length === 1 && !isFamilyPickerOpen && (
              <button
                type="button"
                onClick={() => setIsFamilyPickerOpen(true)}
                className="cursor-pointer text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                ¿Es de otra familia de esta casa?
              </button>
            )}
            {isFamilyPickerShown && (
              <div className="space-y-2 border-t border-border pt-4 sm:max-w-[calc(50%-0.5rem)]">
                <Label htmlFor="member-family">Familia</Label>
                <Select
                  inputId="member-family"
                  options={familyOptions}
                  placeholder="Elige la familia"
                  isSearchable={false}
                  value={familyOptions.find((option) => option.value === (familyChoice || (families.length === 1 ? families[0]?.id : ""))) ?? null}
                  onChange={(option) => changeFamily(option?.value ?? "")}
                />
              </div>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
