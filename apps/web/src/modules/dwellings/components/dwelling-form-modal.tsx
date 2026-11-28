import { Button } from "@juveco/ui/components/button";
import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import {
  DEFAULT_DWELLING_STATUS,
  DWELLING_COORDINATES_PAIR_MESSAGE,
  DWELLING_LATITUDE_INVALID_MESSAGE,
  DWELLING_LATITUDE_RANGE,
  DWELLING_LONGITUDE_INVALID_MESSAGE,
  DWELLING_LONGITUDE_RANGE,
  DWELLING_METER_LENGTH_MESSAGE,
  DWELLING_METER_MAX_LENGTH,
  DWELLING_NEIGHBORHOOD_REQUIRED_MESSAGE,
  DWELLING_TEXT_LENGTH_MESSAGE,
  DWELLING_TEXT_MAX_LENGTH,
  DWELLING_URL_INVALID_MESSAGE,
  DWELLING_URL_LENGTH_MESSAGE,
  DWELLING_URL_MAX_LENGTH,
  type EDwellingStatus,
  type EWallMaterial,
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
import { LocateFixed, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import z from "zod";

import ConfirmModal from "@/common/components/confirm-modal";
import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import Select, { type IOption } from "@/common/components/select";
import TextField from "@/common/components/text-field";
import { useCurrentPosition } from "@/common/hooks/use-current-position";
import { useFindMeterMatches } from "@/modules/dwellings/hooks/use-find-meter-matches";
import { useGetNextDwellingCode } from "@/modules/dwellings/hooks/use-get-next-dwelling-code";
import { useSaveDwelling } from "@/modules/dwellings/hooks/use-save-dwelling";

const FORM_ID = "dwelling-form";
/* Se espera a que deje de escribir antes de preguntarle al servidor por el medidor. */
const METER_MATCH_DEBOUNCE_MS = 400;
const URL_PATTERN = /^https?:\/\/\S+$/i;

const NEIGHBORHOOD_OPTIONS: IOption[] = NEIGHBORHOODS.map((neighborhood) => ({
  value: neighborhood.id,
  label: neighborhood.name,
}));
const STATUS_OPTIONS: IOption[] = Object.entries(dwellingStatusLabels).map(([value, label]) => ({ value, label }));
const MATERIAL_OPTIONS: IOption[] = Object.entries(wallMaterialLabels).map(([value, label]) => ({ value, label }));

const urlRule = z
  .string()
  .trim()
  .max(DWELLING_URL_MAX_LENGTH, DWELLING_URL_LENGTH_MESSAGE)
  .refine((value) => value === "" || URL_PATTERN.test(value), DWELLING_URL_INVALID_MESSAGE);

const textRule = z.string().max(DWELLING_TEXT_MAX_LENGTH, DWELLING_TEXT_LENGTH_MESSAGE);

const isCoordinateInRange = (text: string, range: { min: number; max: number }): boolean => {
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) && value >= range.min && value <= range.max;
};

const formSchema = z
  .object({
    neighborhoodId: z.string(),
    meterNumber: z.string().trim().max(DWELLING_METER_MAX_LENGTH, DWELLING_METER_LENGTH_MESSAGE),
    status: z.string(),
    wallMaterial: z.string(),
    latitude: z.string().trim(),
    longitude: z.string().trim(),
    mapsUrl: urlRule,
    photosUrl: urlRule,
    observation: textRule,
    note: textRule,
  })
  .superRefine((value, context) => {
    if (value.latitude !== "" && !isCoordinateInRange(value.latitude, DWELLING_LATITUDE_RANGE)) {
      context.addIssue({ code: "custom", path: ["latitude"], message: DWELLING_LATITUDE_INVALID_MESSAGE });
    }
    if (value.longitude !== "" && !isCoordinateInRange(value.longitude, DWELLING_LONGITUDE_RANGE)) {
      context.addIssue({ code: "custom", path: ["longitude"], message: DWELLING_LONGITUDE_INVALID_MESSAGE });
    }
    if ((value.latitude === "") !== (value.longitude === "")) {
      const emptyField = value.latitude === "" ? "latitude" : "longitude";
      context.addIssue({ code: "custom", path: [emptyField], message: DWELLING_COORDINATES_PAIR_MESSAGE });
    }
  });

type TDwellingFormValues = z.input<typeof formSchema>;

const buildDefaults = (dwelling?: IDwellingResource): TDwellingFormValues => ({
  neighborhoodId: dwelling?.neighborhood.id ?? "",
  meterNumber: dwelling?.meterNumber ?? "",
  status: dwelling?.status ?? DEFAULT_DWELLING_STATUS,
  wallMaterial: dwelling?.wallMaterial ?? "",
  latitude: dwelling?.latitude === null || dwelling?.latitude === undefined ? "" : String(dwelling.latitude),
  longitude: dwelling?.longitude === null || dwelling?.longitude === undefined ? "" : String(dwelling.longitude),
  mapsUrl: dwelling?.mapsUrl ?? "",
  photosUrl: dwelling?.photosUrl ?? "",
  observation: dwelling?.observation ?? "",
  note: dwelling?.note ?? "",
});

const toCoordinate = (text: string): number | null => (text === "" ? null : Number(text.replace(",", ".")));

const toPayload = (value: TDwellingFormValues): IDwellingInput => ({
  meterNumber: value.meterNumber.trim() || null,
  latitude: toCoordinate(value.latitude.trim()),
  longitude: toCoordinate(value.longitude.trim()),
  mapsUrl: value.mapsUrl.trim() || null,
  status: isDwellingStatus(value.status) ? value.status : DEFAULT_DWELLING_STATUS,
  wallMaterial: isWallMaterial(value.wallMaterial) ? value.wallMaterial : null,
  photosUrl: value.photosUrl.trim() || null,
  observation: value.observation.trim() || null,
  note: value.note.trim() || null,
});

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
 * Registrar o editar una vivienda. Al crear, al elegir el barrio se muestra el código que le
 * tocará («SR-0001») y al guardar una confirmación lo repite; si no tiene medidor, la
 * confirmación lo advierte. Un medidor repetido solo avisa: varias casas pueden compartirlo.
 */
export default function DwellingFormModal({ open, dwelling, onSaved, onClose }: IDwellingFormModalProps) {
  const isEdit = Boolean(dwelling);
  const SaveDwelling = useSaveDwelling();
  const NextCode = useGetNextDwellingCode();
  const MeterMatches = useFindMeterMatches();
  const CurrentPosition = useCurrentPosition();
  const [pending, setPending] = useState<IPendingCreate | null>(null);

  const form = useForm({
    defaultValues: buildDefaults(dwelling),
    validators: { onSubmit: formSchema },
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
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const neighborhoodId = useStore(form.store, (state) => state.values.neighborhoodId);
  const meterNumber = useStore(form.store, (state) => state.values.meterNumber);
  const trimmedMeter = meterNumber.trim();

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(dwelling));
      setPending(null);
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

  const fillFromLocation = async () => {
    if (CurrentPosition.loading) {
      return;
    }
    const position = await CurrentPosition.handler();
    if (position) {
      form.setFieldValue("latitude", String(position.latitude));
      form.setFieldValue("longitude", String(position.longitude));
    }
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
              <FormSubmitButtons
                formId={FORM_ID}
                isSubmitting={isSubmitting}
                label={isEdit ? "Guardar cambios" : "Registrar vivienda"}
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
          <div className="grid gap-4 sm:grid-cols-2">
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
                    onChange={(option) => field.handleChange((option?.value ?? DEFAULT_DWELLING_STATUS) as EDwellingStatus)}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="wallMaterial">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Material de las paredes (opcional)</Label>
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

            <form.Field name="latitude">
              {(field) => (
                <TextField
                  id={field.name}
                  label="Latitud (opcional)"
                  autoComplete="off"
                  inputMode="decimal"
                  placeholder="Ingresa la latitud"
                  value={field.state.value}
                  errors={field.state.meta.errors}
                  onBlur={field.handleBlur}
                  onValueChange={field.handleChange}
                />
              )}
            </form.Field>

            <form.Field name="longitude">
              {(field) => (
                <TextField
                  id={field.name}
                  label="Longitud (opcional)"
                  autoComplete="off"
                  inputMode="decimal"
                  placeholder="Ingresa la longitud"
                  value={field.state.value}
                  errors={field.state.meta.errors}
                  onBlur={field.handleBlur}
                  onValueChange={field.handleChange}
                />
              )}
            </form.Field>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={fillFromLocation}
          >
            <LocateFixed className={CurrentPosition.loading ? "animate-pulse motion-reduce:animate-none" : undefined} />
            {CurrentPosition.loading ? "Buscando tu ubicación…" : "Usar mi ubicación"}
          </Button>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="mapsUrl">
              {(field) => (
                <TextField
                  id={field.name}
                  label="Enlace de Google Maps (opcional)"
                  autoComplete="off"
                  inputMode="url"
                  maxLength={DWELLING_URL_MAX_LENGTH}
                  placeholder="Pega el enlace de Maps"
                  value={field.state.value}
                  errors={field.state.meta.errors}
                  onBlur={field.handleBlur}
                  onValueChange={field.handleChange}
                />
              )}
            </form.Field>

            <form.Field name="photosUrl">
              {(field) => (
                <TextField
                  id={field.name}
                  label="Carpeta de fotos en Drive (opcional)"
                  autoComplete="off"
                  inputMode="url"
                  maxLength={DWELLING_URL_MAX_LENGTH}
                  placeholder="Pega el enlace de la carpeta"
                  value={field.state.value}
                  errors={field.state.meta.errors}
                  onBlur={field.handleBlur}
                  onValueChange={field.handleChange}
                />
              )}
            </form.Field>
          </div>

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
