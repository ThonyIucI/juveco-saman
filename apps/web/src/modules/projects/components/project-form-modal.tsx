import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import { isIsoDate } from "@juveco/shared/dates";
import { INVALID_SOLES_MESSAGE, parseSoles, toSolesInput } from "@juveco/shared/money";
import { PERSON_NOTE_LENGTH_MESSAGE, PERSON_NOTE_MAX_LENGTH } from "@juveco/shared/people";
import {
  EProjectType,
  type IProjectInput,
  type IProjectResource,
  PROJECT_BENEFICIARIES_INVALID_MESSAGE,
  PROJECT_END_BEFORE_START_MESSAGE,
  PROJECT_NAME_LENGTH_MESSAGE,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_NAME_REQUIRED_MESSAGE,
  type TProjectType,
  projectDateLabels,
  projectTypeLabels,
} from "@juveco/shared/projects";
import { useForm, useStore } from "@tanstack/react-form";
import { CalendarDays, Hammer } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import DateField from "@/common/components/date-field";
import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import OptionCards from "@/common/components/option-cards";
import SolesInput from "@/common/components/soles-input";
import TextField from "@/common/components/text-field";
import { todayIso } from "@/common/utils/format-date";
import { useCreateProject } from "@/modules/projects/hooks/use-create-project";
import { useUpdateProject } from "@/modules/projects/hooks/use-update-project";

const FORM_ID = "project-form";

const isPositiveInteger = (value: string) => /^\d+$/.test(value.trim()) && Number(value) > 0;

const formSchema = z
  .object({
    type: z.enum([EProjectType.EVENT, EProjectType.PROJECT]),
    name: z
      .string()
      .trim()
      .min(1, PROJECT_NAME_REQUIRED_MESSAGE)
      .max(PROJECT_NAME_MAX_LENGTH, PROJECT_NAME_LENGTH_MESSAGE),
    description: z.string().max(PERSON_NOTE_MAX_LENGTH, PERSON_NOTE_LENGTH_MESSAGE),
    startDate: z.string().refine(isIsoDate, "Elige una fecha válida."),
    /* Vacío = sin fecha de fin. */
    endDate: z.string(),
    goalAmount: z.string().refine((value) => value.trim() === "" || parseSoles(value) !== null, INVALID_SOLES_MESSAGE),
    beneficiaryCount: z
      .string()
      .refine((value) => value.trim() === "" || isPositiveInteger(value), PROJECT_BENEFICIARIES_INVALID_MESSAGE),
  })
  .refine((value) => value.endDate === "" || value.endDate >= value.startDate, {
    path: ["endDate"],
    message: PROJECT_END_BEFORE_START_MESSAGE,
  });

type TProjectFormValues = z.input<typeof formSchema>;

const buildDefaults = (project?: IProjectResource): TProjectFormValues => ({
  type: project?.type ?? EProjectType.EVENT,
  name: project?.name ?? "",
  description: project?.description ?? "",
  startDate: project?.startDate ?? todayIso(),
  endDate: project?.endDate ?? "",
  goalAmount: project?.goalAmount != null ? toSolesInput(project.goalAmount) : "",
  beneficiaryCount: project?.beneficiaryCount != null ? String(project.beneficiaryCount) : "",
});

const toPayload = (value: TProjectFormValues): IProjectInput => ({
  type: value.type,
  name: value.name.trim(),
  description: value.description.trim() || null,
  startDate: value.startDate,
  endDate: value.endDate || null,
  goalAmount: value.goalAmount.trim() ? parseSoles(value.goalAmount) : null,
  beneficiaryCount: value.beneficiaryCount.trim() ? Number(value.beneficiaryCount) : null,
});

const TYPE_OPTIONS: { value: TProjectType; label: string; icon: typeof CalendarDays }[] = [
  { value: EProjectType.EVENT, label: projectTypeLabels.EVENT, icon: CalendarDays },
  { value: EProjectType.PROJECT, label: projectTypeLabels.PROJECT, icon: Hammer },
];

interface IProjectFormModalProps {
  open: boolean;
  /** Sin proyecto: nuevo. Con proyecto: edición. */
  project?: IProjectResource;
  onSaved: (project: IProjectResource) => void;
  onClose: () => void;
}

/** Un evento (una fecha, como la Chocolatada) o un proyecto (una obra, como el mural). */
export default function ProjectFormModal({ open, project, onSaved, onClose }: IProjectFormModalProps) {
  const CreateProject = useCreateProject();
  const UpdateProject = useUpdateProject();

  const form = useForm({
    defaultValues: buildDefaults(project),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = toPayload(value);
      const saved = project
        ? await UpdateProject.handler(project.id, payload)
        : await CreateProject.handler(payload);
      if (!saved) {
        return;
      }
      onSaved(saved);
      onClose();
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const type = useStore(form.store, (state) => state.values.type);
  const startDate = useStore(form.store, (state) => state.values.startDate);
  const dateLabels = projectDateLabels[type];

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(project));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project]);

  return (
    <Modal
      isDirty={isDirty}
      open={open}
      title={project ? "Editar" : "Nuevo evento o proyecto"}
      width="lg"
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons
              formId={FORM_ID}
              isSubmitting={isSubmitting}
              label={project ? "Guardar cambios" : "Crear"}
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
        <form.Field name="type">
          {(field) => (
            <div className="space-y-2">
              <Label id="project-type-label">Tipo</Label>
              <OptionCards
                labelledBy="project-type-label"
                options={TYPE_OPTIONS}
                value={field.state.value}
                onChange={field.handleChange}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="name">
          {(field) => (
            <TextField
              id={field.name}
              label="Nombre"
              autoComplete="off"
              maxLength={PROJECT_NAME_MAX_LENGTH}
              placeholder="Ingresa el nombre"
              value={field.state.value}
              errors={field.state.meta.errors}
              onBlur={field.handleBlur}
              onValueChange={field.handleChange}
            />
          )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="startDate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{dateLabels.start}</Label>
                <DateField
                  id={field.name}
                  value={field.state.value}
                  fallbackMonth={todayIso()}
                  isInvalid={field.state.meta.errors.length > 0}
                  onChange={field.handleChange}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="endDate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{dateLabels.end} (opcional)</Label>
                <DateField
                  id={field.name}
                  value={field.state.value}
                  placeholder="Sin fecha"
                  fallbackMonth={startDate}
                  rangeEdge={startDate}
                  isInvalid={field.state.meta.errors.length > 0}
                  onChange={field.handleChange}
                  onClear={() => field.handleChange("")}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="goalAmount">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Meta de recaudación (opcional)</Label>
                <SolesInput
                  id={field.name}
                  placeholder="Ingresa la meta"
                  isInvalid={field.state.meta.errors.length > 0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="beneficiaryCount">
            {(field) => (
              <TextField
                id={field.name}
                label="Beneficiarios (opcional)"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Ej. 400 niños"
                value={field.state.value}
                errors={field.state.meta.errors}
                onBlur={field.handleBlur}
                onValueChange={(value) => field.handleChange(value.replace(/\D/g, ""))}
              />
            )}
          </form.Field>
        </div>

        <form.Field name="description">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Descripción (opcional)</Label>
              <Textarea
                id={field.name}
                name={field.name}
                rows={3}
                maxLength={PERSON_NOTE_MAX_LENGTH}
                placeholder="¿Para qué es?"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="min-h-24 rounded-lg border border-field-border bg-field px-4 py-3 dark:bg-field text-sm font-medium focus-visible:ring-4 focus-visible:ring-ring/30 md:text-sm"
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
