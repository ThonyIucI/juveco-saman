import { Button } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import type { IActivityResource } from "@juveco/shared/activities";
import {
  type IActivityTeamInput,
  type IActivityTeamResource,
  TEAM_DELEGATE_REQUIRED_MESSAGE,
  TEAM_MAX_PLAYERS,
  TEAM_NAME_LENGTH_MESSAGE,
  TEAM_NAME_MAX_LENGTH,
  TEAM_NAME_REQUIRED_MESSAGE,
  TEAM_PLAYERS_MAX_MESSAGE,
} from "@juveco/shared/activity-teams";
import { PERSON_NOTE_LENGTH_MESSAGE, PERSON_NOTE_MAX_LENGTH, fullName } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";
import { useForm, useStore } from "@tanstack/react-form";
import { UserPlus, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import Modal from "@/common/components/modal";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import TextField from "@/common/components/text-field";
import { useSaveActivityTeam } from "@/modules/activities/hooks/use-save-activity-team";
import UserSearch from "@/modules/users/components/user-search";

const FORM_ID = "team-form";

const formSchema = z.object({
  name: z.string().trim().min(1, TEAM_NAME_REQUIRED_MESSAGE).max(TEAM_NAME_MAX_LENGTH, TEAM_NAME_LENGTH_MESSAGE),
  delegateId: z.string().min(1, TEAM_DELEGATE_REQUIRED_MESSAGE),
  playerIds: z.array(z.string()).max(TEAM_MAX_PLAYERS, TEAM_PLAYERS_MAX_MESSAGE),
  note: z.string().max(PERSON_NOTE_MAX_LENGTH, PERSON_NOTE_LENGTH_MESSAGE),
});

type TTeamFormValues = z.input<typeof formSchema>;

const buildDefaults = (team?: IActivityTeamResource): TTeamFormValues => ({
  name: team?.name ?? "",
  delegateId: team?.delegate.id ?? "",
  playerIds: team?.players.map((player) => player.id) ?? [],
  note: team?.note ?? "",
});

const toPayload = (value: TTeamFormValues): IActivityTeamInput => ({
  name: value.name.trim(),
  delegateId: value.delegateId,
  playerIds: value.playerIds,
  note: value.note.trim() || null,
});

interface ITeamFormModalProps {
  open: boolean;
  activity: IActivityResource;
  /** Sin equipo: inscripción nueva. Con equipo: edición. */
  team?: IActivityTeamResource;
  /** Todos los equipos del campeonato: un jugador de otro equipo no aparece en el buscador. */
  teams: IActivityTeamResource[];
  /** Las personas para elegir al delegado y a los jugadores. */
  users: IUserResource[];
  /** Una persona creada desde el buscador: la lista de usuarios se entera. */
  onUserCreated: (user: IUserResource) => void;
  onSaved: (team: IActivityTeamResource) => void;
  onClose: () => void;
}

/**
 * Inscribir o editar un equipo: nombre, delegado y hasta 15 jugadores, todos personas de
 * Juveco (se pueden crear desde el buscador). El delegado va aparte: si también juega, se
 * agrega a la lista con un toque (Thony, 2026-11-19).
 */
export default function TeamFormModal({
  open,
  activity,
  team,
  teams,
  users,
  onUserCreated,
  onSaved,
  onClose,
}: ITeamFormModalProps) {
  const isEdit = Boolean(team);
  const SaveActivityTeam = useSaveActivityTeam();

  /* Quienes ya juegan en otro equipo: la API los rechaza, así que ni se ofrecen. */
  const takenIds = useMemo(
    () =>
      new Set(
        teams.filter((other) => other.id !== team?.id).flatMap((other) => other.players.map((player) => player.id)),
      ),
    [teams, team?.id],
  );

  const form = useForm({
    defaultValues: buildDefaults(team),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const saved = await SaveActivityTeam.handler(activity.id, toPayload(value), team);
      if (saved) {
        onSaved(saved);
        onClose();
      }
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const delegateId = useStore(form.store, (state) => state.values.delegateId);

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(team));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, team]);

  const userById = (id: string) => users.find((user) => user.id === id);

  return (
    <Modal
      isDirty={isDirty}
      open={open}
      title={isEdit ? "Editar equipo" : "Agregar equipo"}
      subtitle={activity.name}
      width="lg"
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons
              formId={FORM_ID}
              isSubmitting={isSubmitting}
              label={isEdit ? "Guardar cambios" : "Agregar equipo"}
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
          <form.Field name="name">
            {(field) => (
              <TextField
                id={field.name}
                label="Nombre del equipo"
                autoComplete="off"
                maxLength={TEAM_NAME_MAX_LENGTH}
                placeholder="Ingresa el nombre"
                value={field.state.value}
                errors={field.state.meta.errors}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
              />
            )}
          </form.Field>

          <form.Field name="delegateId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Delegado</Label>
                <UserSearch
                  id={field.name}
                  users={users}
                  value={userById(field.state.value) ?? null}
                  isInvalid={field.state.meta.errors.length > 0}
                  onChange={(user) => field.handleChange(user?.id ?? "")}
                  onCreated={onUserCreated}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="playerIds">
          {(field) => {
            const playerIds = field.state.value;
            const isFull = playerIds.length >= TEAM_MAX_PLAYERS;
            const chosen = new Set(playerIds);
            const available = users.filter((user) => !chosen.has(user.id) && !takenIds.has(user.id));
            const canAddDelegate = Boolean(delegateId) && !chosen.has(delegateId) && !takenIds.has(delegateId);
            const add = (id: string) => field.handleChange([...playerIds, id]);
            const remove = (id: string) => field.handleChange(playerIds.filter((playerId) => playerId !== id));

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={field.name}>Jugadores</Label>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {playerIds.length} de {TEAM_MAX_PLAYERS}
                  </span>
                </div>

                {isFull ? (
                  <p className="text-sm text-muted-foreground">Ya están los {TEAM_MAX_PLAYERS} jugadores.</p>
                ) : (
                  <UserSearch
                    id={field.name}
                    users={available}
                    value={null}
                    isInvalid={field.state.meta.errors.length > 0}
                    onChange={(user) => user && add(user.id)}
                    onCreated={onUserCreated}
                  />
                )}

                {!isFull && canAddDelegate && (
                  <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => add(delegateId)}>
                    <UserPlus />
                    El delegado también juega
                  </Button>
                )}

                {playerIds.length > 0 && (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {playerIds.map((id, index) => {
                      const player = userById(id);
                      const name = player ? fullName(player) : "Persona";
                      return (
                        <li key={id} className="flex items-center gap-3 px-3 py-2">
                          <span className="w-5 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                            {index + 1}
                          </span>
                          <InitialsAvatar name={name} color={avatarColorOf(name)} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">
                              {name}
                              {id === delegateId && (
                                <span className="font-normal text-muted-foreground"> · delegado</span>
                              )}
                            </p>
                            {player?.neighborhood && <NeighborhoodBadge neighborhood={player.neighborhood} />}
                          </div>
                          <IconButton label={`Quitar a ${name}`} onClick={() => remove(id)}>
                            <X />
                          </IconButton>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <FieldError errors={field.state.meta.errors} />
              </div>
            );
          }}
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
