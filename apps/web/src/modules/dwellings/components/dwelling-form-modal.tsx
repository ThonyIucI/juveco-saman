import { Button } from "@juveco/ui/components/button";
import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import { cn } from "@juveco/ui/lib/utils";
import {
  DEFAULT_DWELLING_STATUS,
  DWELLING_METER_MAX_LENGTH,
  DWELLING_NEIGHBORHOOD_REQUIRED_MESSAGE,
  DWELLING_TEXT_MAX_LENGTH,
  DWELLING_WALL_MATERIAL_OTHER_MAX_LENGTH,
  DWELLING_WALL_MATERIAL_OTHER_REQUIRED_MESSAGE,
  EDwellingStatus,
  EWallMaterial,
  type IDwellingDetailResource,
  type IDwellingInput,
  type IDwellingResource,
  dwellingStatusLabels,
  isDwellingStatus,
  isWallMaterial,
  meterAlreadyUsedMessage,
  wallMaterialLabels,
} from "@juveco/shared/dwellings";
import { NEIGHBORHOODS } from "@juveco/shared/neighborhoods";
import { useForm, useStore } from "@tanstack/react-form";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import InfoTip from "@/common/components/info-tip";
import Modal from "@/common/components/modal";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import Select, { type IOption } from "@/common/components/select";
import TextField from "@/common/components/text-field";
import type { ICoordinates } from "@/common/hooks/use-current-position";
import { useFindMeterMatches } from "@/modules/dwellings/hooks/use-find-meter-matches";
import { useGetNextDwellingCode } from "@/modules/dwellings/hooks/use-get-next-dwelling-code";
import { useSaveDwelling } from "@/modules/dwellings/hooks/use-save-dwelling";

import DwellingLocationStep from "./dwelling-location-step";

const FORM_ID = "dwelling-form";
/* Se espera a que deje de escribir antes de preguntarle al servidor por el medidor. */
const METER_MATCH_DEBOUNCE_MS = 400;
const WALL_MATERIAL_HELP = "Elige el material de las paredes. Si hay varios, el que más predomina.";

const NEIGHBORHOOD_OPTIONS: IOption[] = NEIGHBORHOODS.map((neighborhood) => ({
  value: neighborhood.id,
  label: neighborhood.name,
}));
const STATUS_OPTIONS: IOption[] = Object.entries(dwellingStatusLabels).map(([value, label]) => ({ value, label }));
const MATERIAL_OPTIONS: IOption[] = Object.entries(wallMaterialLabels).map(([value, label]) => ({ value, label }));

interface IDwellingFormValues {
  neighborhoodId: string;
  meterNumber: string;
  status: EDwellingStatus;
  wallMaterial: EWallMaterial | "";
  wallMaterialOther: string;
  position: ICoordinates | null;
  observation: string;
  note: string;
}

type TFieldName = keyof IDwellingFormValues;

/* Los campos de cada paso: «Siguiente» valida solo los del paso actual. */
const STEPS: readonly { title: string; fields: readonly TFieldName[] }[] = [
  {
    title: "Vivienda",
    fields: ["neighborhoodId", "meterNumber", "status", "wallMaterial", "wallMaterialOther"],
  },
  { title: "Ubicación", fields: ["position"] },
  { title: "Notas", fields: ["observation", "note"] },
];
const FIRST_STEP = 0;
const LAST_STEP = STEPS.length - 1;

const buildDefaults = (dwelling?: IDwellingResource): IDwellingFormValues => ({
  neighborhoodId: dwelling?.neighborhood.id ?? "",
  meterNumber: dwelling?.meterNumber ?? "",
  status: dwelling?.status ?? DEFAULT_DWELLING_STATUS,
  wallMaterial: dwelling?.wallMaterial ?? "",
  wallMaterialOther: dwelling?.wallMaterialOther ?? "",
  position:
    dwelling && dwelling.latitude !== null && dwelling.longitude !== null
      ? { latitude: dwelling.latitude, longitude: dwelling.longitude }
      : null,
  observation: dwelling?.observation ?? "",
  note: dwelling?.note ?? "",
});

const toPayload = (value: IDwellingFormValues): IDwellingInput => {
  const material = isWallMaterial(value.wallMaterial) ? value.wallMaterial : null;
  return {
    meterNumber: value.meterNumber.trim() || null,
    latitude: value.position?.latitude ?? null,
    longitude: value.position?.longitude ?? null,
    status: isDwellingStatus(value.status) ? value.status : DEFAULT_DWELLING_STATUS,
    wallMaterial: material,
    wallMaterialOther: material === EWallMaterial.OTHER ? value.wallMaterialOther.trim() || null : null,
    observation: value.observation.trim() || null,
    note: value.note.trim() || null,
  };
};

const TEXTAREA_CLASS =
  "min-h-24 rounded-lg border border-field-border bg-field px-4 py-3 text-sm font-medium focus-visible:ring-4 focus-visible:ring-ring/30 md:text-sm dark:bg-field";

/** Una vivienda lista para guardar, esperando que se confirme el código que se le asignará. */
interface IPendingCreate {
  neighborhoodId: string;
  payload: IDwellingInput;
  code: string;
}

interface IDwellingFormModalProps {
  open: boolean;
  /** Sin vivienda: alta. Con vivienda: edición (el barrio no cambia). */
  dwelling?: IDwellingResource;
  onSaved: (dwelling: IDwellingDetailResource) => void;
  onClose: () => void;
}

/**
 * Registrar o editar una vivienda en tres pasos: Vivienda, Ubicación (mapa con pin) y Notas.
 * Los tres pasos quedan montados (los inactivos ocultos), así «Atrás» no pierde lo escrito.
 * Al crear, al elegir el barrio se muestra el código que le tocará («SR-0001») y al guardar
 * una confirmación lo repite; si no tiene medidor, la confirmación lo advierte. Un medidor
 * repetido solo avisa: varias casas pueden compartirlo. Al editar se puede saltar a cualquier paso.
 */
export default function DwellingFormModal({ open, dwelling, onSaved, onClose }: IDwellingFormModalProps) {
  const isEdit = Boolean(dwelling);
  const SaveDwelling = useSaveDwelling();
  const NextCode = useGetNextDwellingCode();
  const MeterMatches = useFindMeterMatches();
  const [pending, setPending] = useState<IPendingCreate | null>(null);
  const [step, setStep] = useState(FIRST_STEP);

  const form = useForm({
    defaultValues: buildDefaults(dwelling),
    onSubmit: async ({ value }) => {
      const payload = toPayload(value);
      if (dwelling) {
        const saved = await SaveDwelling.update(dwelling.id, payload);
        if (saved) {
          onSaved(saved);
          onClose();
        }
        return;
      }
      if (!value.neighborhoodId) {
        return;
      }
      /* El código se pide de nuevo al guardar: es el que se confirma y el que se manda. */
      const next = await NextCode.handler(value.neighborhoodId);
      if (next) {
        setPending({ neighborhoodId: value.neighborhoodId, payload, code: next.code });
      }
    },
    /* Si el error quedó en un paso que no se ve, se vuelve a ese paso. */
    onSubmitInvalid: () => {
      const invalidStep = STEPS.findIndex((item) => hasStepErrors(item.fields));
      if (invalidStep >= 0) {
        setStep(invalidStep);
      }
    },
  });

  const hasStepErrors = (fields: readonly TFieldName[]): boolean =>
    fields.some((name) => (form.getFieldMeta(name)?.errors.length ?? 0) > 0);

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const neighborhoodId = useStore(form.store, (state) => state.values.neighborhoodId);
  const meterNumber = useStore(form.store, (state) => state.values.meterNumber);
  const wallMaterial = useStore(form.store, (state) => state.values.wallMaterial);
  const position = useStore(form.store, (state) => state.values.position);
  const trimmedMeter = meterNumber.trim();

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(dwelling));
      setPending(null);
      setStep(FIRST_STEP);
      NextCode.clear();
      MeterMatches.clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dwelling]);

  /* El código que le tocará, ya al elegir el barrio. */
  useEffect(() => {
    if (!open || isEdit || !neighborhoodId) {
      NextCode.clear();
      return;
    }
    const controller = new AbortController();
    NextCode.handler(neighborhoodId, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, neighborhoodId]);

  /* Medidor repetido: se pregunta al dejar de escribir. */
  useEffect(() => {
    if (!open || trimmedMeter === "") {
      MeterMatches.clear();
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => MeterMatches.handler(trimmedMeter, dwelling?.id, controller.signal),
      METER_MATCH_DEBOUNCE_MS,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trimmedMeter, dwelling?.id]);

  /* Valida solo los campos de un paso; los demás pasos no se tocan. */
  const validateStep = async (index: number): Promise<boolean> => {
    await Promise.all(STEPS[index].fields.map((name) => form.validateField(name, "submit")));
    return !hasStepErrors(STEPS[index].fields);
  };

  const goNext = async () => {
    if (step >= LAST_STEP) {
      return;
    }
    if (await validateStep(step)) {
      setStep(step + 1);
    }
  };

  const goBack = () => setStep(Math.max(FIRST_STEP, step - 1));

  /* Al editar se salta a cualquier paso; al crear, atrás libre y adelante de a un paso con validación. */
  const goToStep = (target: number) => {
    if (isEdit || target <= step) {
      setStep(target);
      return;
    }
    goNext();
  };

  const confirmCreate = async () => {
    if (!pending || SaveDwelling.loading) {
      return;
    }
    const saved = await SaveDwelling.create({
      ...pending.payload,
      neighborhoodId: pending.neighborhoodId,
      expectedCode: pending.code,
    });
    if (saved) {
      setPending(null);
      onSaved(saved);
      onClose();
      return;
    }
    /* Si otro ocupó el código, se pide el nuevo y se vuelve a confirmar. */
    setPending(null);
    await NextCode.handler(pending.neighborhoodId);
  };

  const confirmDescription = pending
    ? pending.payload.meterNumber
      ? `Se le asignará el código ${pending.code}.`
      : `Esta vivienda no tiene medidor. Se le asignará el código ${pending.code}.`
    : undefined;

  const isLastStep = step === LAST_STEP;
  const isOtherMaterial = wallMaterial === EWallMaterial.OTHER;
  /* Al editar, guardar está siempre a mano; al crear, «Siguiente» hasta el último paso. */
  const showSubmit = isEdit || isLastStep;

  return (
    <>
      <Modal
        isDirty={isDirty}
        open={open}
        title={isEdit ? `Editar ${dwelling?.code ?? "vivienda"}` : "Nueva vivienda"}
        width="lg"
        onClose={onClose}
        footer={
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <>
                {step > FIRST_STEP && !isEdit && (
                  <Button type="button" variant="outline" onClick={goBack}>
                    Atrás
                  </Button>
                )}
                {showSubmit ? (
                  <FormSubmitButtons
                    formId={FORM_ID}
                    isSubmitting={isSubmitting}
                    label={isEdit ? "Guardar cambios" : "Registrar vivienda"}
                  />
                ) : (
                  <Button type="button" className="min-w-32" onClick={goNext}>
                    Siguiente
                  </Button>
                )}
              </>
            )}
          </form.Subscribe>
        }
      >
        <div className="mb-4 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Paso {step + 1} de {STEPS.length} · {STEPS[step].title}
          </p>
          <ol className="flex gap-1.5">
            {STEPS.map((item, index) => (
              <li key={item.title} className="flex-1">
                <button
                  type="button"
                  aria-label={`Paso ${index + 1}: ${item.title}`}
                  aria-current={index === step ? "step" : undefined}
                  onClick={() => goToStep(index)}
                  className="group block w-full cursor-pointer rounded-full py-2 outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
                >
                  <span
                    className={cn(
                      "block h-1.5 w-full rounded-full transition-colors",
                      index <= step ? "bg-primary" : "bg-muted group-hover:bg-primary/30",
                    )}
                  />
                </button>
              </li>
            ))}
          </ol>
        </div>

        <form
          id={FORM_ID}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            /* Enter en un paso intermedio (al crear) avanza; no guarda a medias. */
            if (!isEdit && !isLastStep) {
              goNext();
              return;
            }
            if (!form.state.isSubmitting) {
              form.handleSubmit();
            }
          }}
        >
          {/* Paso 1 · Vivienda */}
          <div hidden={step !== 0} className="grid gap-4 sm:grid-cols-2">
            <form.Field
              name="neighborhoodId"
              validators={{
                onSubmit: ({ value }) =>
                  !isEdit && !value ? { message: DWELLING_NEIGHBORHOOD_REQUIRED_MESSAGE } : undefined,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Barrio</Label>
                  {isEdit && dwelling ? (
                    /* El barrio no cambia: el código lleva sus iniciales. */
                    <div className="flex h-control items-center">
                      <NeighborhoodBadge neighborhood={dwelling.neighborhood} hasIcon={false} />
                    </div>
                  ) : (
                    <Select
                      inputId={field.name}
                      options={NEIGHBORHOOD_OPTIONS}
                      placeholder="Elige el barrio"
                      isSearchable={false}
                      isInvalid={field.state.meta.errors.length > 0}
                      formatOptionLabel={(option) => (
                        <NeighborhoodBadge neighborhood={{ id: option.value, name: option.label }} hasIcon={false} />
                      )}
                      value={NEIGHBORHOOD_OPTIONS.find((option) => option.value === field.state.value) ?? null}
                      onBlur={field.handleBlur}
                      onChange={(option) => field.handleChange(option?.value ?? "")}
                    />
                  )}
                  {!isEdit && NextCode.code && (
                    <p className="text-sm text-muted-foreground">
                      Se le asignará <span className="font-mono font-semibold text-foreground">{NextCode.code}</span>
                    </p>
                  )}
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Field name="meterNumber">
              {(field) => (
                <div className="space-y-2">
                  <TextField
                    id={field.name}
                    label="Número de medidor (opcional)"
                    autoComplete="off"
                    maxLength={DWELLING_METER_MAX_LENGTH}
                    placeholder="Ingresa el número de medidor"
                    value={field.state.value}
                    errors={field.state.meta.errors}
                    onBlur={field.handleBlur}
                    onValueChange={field.handleChange}
                  />
                  {/* Se deja guardar igual: varias casas pueden compartir medidor. */}
                  {MeterMatches.matches.length > 0 && (
                    <p role="status" className="flex items-start gap-1.5 text-sm font-medium text-yellow">
                      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                      {meterAlreadyUsedMessage(MeterMatches.matches.map((match) => match.code))}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="status">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Estado de la vivienda</Label>
                  <Select
                    inputId={field.name}
                    options={STATUS_OPTIONS}
                    isSearchable={false}
                    value={STATUS_OPTIONS.find((option) => option.value === field.state.value) ?? null}
                    onBlur={field.handleBlur}
                    onChange={(option) =>
                      field.handleChange((option?.value ?? DEFAULT_DWELLING_STATUS) as EDwellingStatus)
                    }
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="wallMaterial">
              {(field) => (
                <div className="space-y-2">
                  {/* El (i) va fuera del label: tocarlo no debe enfocar el select. */}
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={field.name}>Material de las paredes (opcional)</Label>
                    <InfoTip label="Ayuda sobre el material de las paredes">{WALL_MATERIAL_HELP}</InfoTip>
                  </div>
                  <Select
                    inputId={field.name}
                    options={MATERIAL_OPTIONS}
                    placeholder="Elige el material"
                    isClearable
                    isSearchable={false}
                    value={MATERIAL_OPTIONS.find((option) => option.value === field.state.value) ?? null}
                    onBlur={field.handleBlur}
                    onChange={(option) => field.handleChange((option?.value ?? "") as EWallMaterial | "")}
                  />
                </div>
              )}
            </form.Field>

            {isOtherMaterial && (
              <form.Field
                name="wallMaterialOther"
                validators={{
                  onSubmit: ({ value, fieldApi }) =>
                    fieldApi.form.getFieldValue("wallMaterial") === EWallMaterial.OTHER && value.trim() === ""
                      ? { message: DWELLING_WALL_MATERIAL_OTHER_REQUIRED_MESSAGE }
                      : undefined,
                }}
              >
                {(field) => (
                  <div className="sm:col-span-2">
                    <TextField
                      id={field.name}
                      label="Especifica el material"
                      autoComplete="off"
                      maxLength={DWELLING_WALL_MATERIAL_OTHER_MAX_LENGTH}
                      placeholder="Ingresa el material"
                      value={field.state.value}
                      errors={field.state.meta.errors}
                      onBlur={field.handleBlur}
                      onValueChange={field.handleChange}
                    />
                  </div>
                )}
              </form.Field>
            )}
          </div>

          {/* Paso 2 · Ubicación. El mapa se monta solo mientras se ve: Leaflet mide su caja al nacer. */}
          <div hidden={step !== 1}>
            {step === 1 && (
              <form.Field name="position">
                {(field) => (
                  <DwellingLocationStep position={position} onChange={(next) => field.handleChange(next)} />
                )}
              </form.Field>
            )}
          </div>

          {/* Paso 3 · Notas. Más adelante, acá van las fotos (slice 2c). */}
          <div hidden={step !== 2} className="space-y-4">
            <form.Field name="observation">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Observación (opcional)</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={3}
                    maxLength={DWELLING_TEXT_MAX_LENGTH}
                    placeholder="Ingresa una observación"
                    aria-invalid={field.state.meta.errors.length > 0}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    className={TEXTAREA_CLASS}
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
                    maxLength={DWELLING_TEXT_MAX_LENGTH}
                    placeholder="Ingresa una nota"
                    aria-invalid={field.state.meta.errors.length > 0}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    className={TEXTAREA_CLASS}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={pending !== null}
        title="¿Registrar la vivienda?"
        description={confirmDescription}
        confirmLabel="Registrar"
        loading={SaveDwelling.loading}
        onConfirm={confirmCreate}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
