import type { IUserResource } from "@juveco/shared/users";
import { fullName } from "@juveco/shared/people";
import { countryOfPhone, formatNationalPhone, toFullPhone } from "@juveco/shared/phones";
import { formatWhatsAppUsername } from "@juveco/shared/whatsapp";
import { userRoleLabels } from "@juveco/shared/roles";
import { AtSign, CalendarDays, KeyRound, Mail, MapPin, MessageSquareText, Phone } from "lucide-react";
import { useEffect, useState } from "react";

import CountryFlag from "@/common/components/country-flag";
import { DetailList, DetailRow, DetailSection } from "@/common/components/detail-section";
import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import SidePanel from "@/common/components/side-panel";
import WhatsAppButton from "@/common/components/whatsapp-button";
import { formatShortDate } from "@/common/utils/format-date";

/* Editar y eliminar van directos; el resto (dar acceso…) queda en `⋯` (Thony, 2026-11-09). */
const INLINE_ACTION_LABELS = new Set(["Editar", "Eliminar"]);

const withInlineActions = (actions: IRowAction[]): IRowAction[] =>
  actions.map((action) => (INLINE_ACTION_LABELS.has(action.label) ? { ...action, inline: true } : action));

interface IUserDetailPanelProps {
  /** El usuario abierto; `null` cierra el panel. */
  user: IUserResource | null;
  /** Las mismas acciones del `⋯` de la lista (dependen del rol de quien mira). */
  buildActions: (user: IUserResource) => IRowAction[];
  onClose: () => void;
}

/**
 * Detalle lateral de una persona: Datos (barrio, número y usuario de WhatsApp, cada uno con
 * su copiar, rol, correo si entra a la app, y desde cuándo está registrada) y Nota, el único
 * lugar donde se ve. Arriba, WhatsApp abre el chat y `⋯` tiene las acciones.
 */
export default function UserDetailPanel({ user, buildActions, onClose }: IUserDetailPanelProps) {
  /* El panel se queda con el último usuario mientras se anima al cerrarse. */
  const [shown, setShown] = useState<IUserResource | null>(user);

  useEffect(() => {
    if (user) {
      setShown(user);
    }
  }, [user]);

  const current = user ?? shown;

  const actions: IRowAction[] = current ? withInlineActions(buildActions(current)) : [];

  const phone = current?.phone ?? null;
  const country = phone ? countryOfPhone(phone.countryPrefix, phone.number) : null;
  const username = current?.whatsappUsername ? formatWhatsAppUsername(current.whatsappUsername) : null;

  return (
    <SidePanel
      open={user !== null}
      label={current ? `Usuario ${fullName(current)}` : "Usuario"}
      backLabel="Usuarios"
      onClose={onClose}
      actions={
        current && (
          <>
            <WhatsAppButton phone={current.phone} username={current.whatsappUsername} />
            <RowActions actions={actions} isBordered />
          </>
        )
      }
    >
      {current && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <InitialsAvatar
              name={fullName(current)}
              color={avatarColorOf(fullName(current))}
              className="size-14 text-lg"
            />
            <h2 className="min-w-0 truncate font-heading text-xl font-bold text-foreground">
              {fullName(current)}
            </h2>
          </div>

          <DetailSection title="Datos">
            <DetailList>
              <DetailRow icon={MapPin} label="Barrio">
                {current.neighborhood?.name}
              </DetailRow>
              <DetailRow
                icon={Phone}
                label="Número"
                copy={
                  phone
                    ? {
                        label: "Copiar número",
                        successMessage: "Número copiado",
                        getText: () => toFullPhone(phone.countryPrefix, phone.number),
                      }
                    : undefined
                }
              >
                {phone && country && (
                  <span className="inline-flex items-center gap-2 tabular-nums">
                    <CountryFlag country={country} />
                    {formatNationalPhone(phone.number, country)}
                  </span>
                )}
              </DetailRow>
              <DetailRow
                icon={AtSign}
                label="Usuario"
                copy={
                  username
                    ? { label: "Copiar usuario", successMessage: "Usuario copiado", getText: () => username }
                    : undefined
                }
              >
                {username}
              </DetailRow>
              <DetailRow icon={KeyRound} label="Rol">
                {userRoleLabels[current.role]}
              </DetailRow>
              <DetailRow icon={Mail} label="Correo">
                {current.email}
              </DetailRow>
              <DetailRow icon={CalendarDays} label="Registrado el">
                {formatShortDate(current.createdAt)}
              </DetailRow>
            </DetailList>
          </DetailSection>

          <DetailSection title="Nota">
            <p className="flex items-start gap-2 text-sm">
              <MessageSquareText aria-hidden className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
              <span className={current.note ? "text-foreground" : "text-muted-foreground"}>
                {current.note ?? "No hay nota"}
              </span>
            </p>
          </DetailSection>
        </div>
      )}
    </SidePanel>
  );
}
