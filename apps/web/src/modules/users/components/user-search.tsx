import { IconButton } from "@juveco/ui/components/icon-button";
import type { IUserResource } from "@juveco/shared/users";
import { fullName } from "@juveco/shared/people";
import { DEFAULT_COUNTRY, DEFAULT_COUNTRY_PREFIX, type IPhone, onlyDigits, parseFullPhone } from "@juveco/shared/phones";
import { Plus, UserRound, X } from "lucide-react";
import { type KeyboardEvent, useId, useState } from "react";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import SearchInput from "@/common/components/search-input";
import type { IPersonInitialValues } from "@/common/utils/person-form";
import { useDocumentUserIds } from "@/modules/users/hooks/use-document-user-ids";
import { looksLikeDocumentNumber, looksLikePhone, matchesUserSearch } from "@/modules/users/utils/user-search";

import UserFormModal from "./user-form-modal";

/* Más resultados no ayudan: si no está entre los primeros, se escribe más. */
const MAX_RESULTS = 6;

/* «+51 987 654 321» se separa en prefijo y número, como al pegarlo en el campo. */
const phoneOfTyped = (typed: string): IPhone => {
  const parsed = parseFullPhone(typed, DEFAULT_COUNTRY);
  return parsed
    ? { countryPrefix: parsed.countryPrefix, number: parsed.number }
    : { countryPrefix: DEFAULT_COUNTRY_PREFIX, number: onlyDigits(typed) };
};

interface IUserSearchProps {
  /** Para que un `<Label htmlFor>` apunte al buscador. */
  id?: string;
  users: IUserResource[];
  /** El elegido; `null` muestra el buscador. */
  value: IUserResource | null;
  isInvalid?: boolean;
  onChange: (user: IUserResource | null) => void;
  /** Uno creado o editado desde acá: la lista de usuarios se entera. Sin `onStartCreate`, es obligatorio. */
  onCreated?: (user: IUserResource) => void;
  /**
   * Con él, la persona nueva se arma en el formulario de quien llama: «Crear «…»» le pasa lo
   * escrito en vez de abrir la modal de Usuarios, y la card elegida no se edita desde acá.
   */
  onStartCreate?: (values: IPersonInitialValues) => void;
  /** El texto de la primera opción; por defecto «Crear «lo escrito»». */
  createLabel?: (term: string) => string;
  /** Debajo del nombre del elegido (p. ej. su DNI), cuando se conoce. */
  detail?: string | null;
  placeholder?: string;
}

const defaultCreateLabel = (term: string) => `Crear «${term}»`;

/**
 * Buscador para elegir a una persona, como el de las órdenes de id-pos (`SearchClientMulti`): se escribe nombre, número o usuario y aparecen los que coinciden;
 * arriba, «Crear «…»» abre **la modal de usuario** con lo escrito (el nombre, o el número si
 * es un número). Elegido, se ve su card con ✕ para cambiarlo.
 *
 * Filtra la lista ya cargada, sin debounce: es instantáneo. Si algún día hay miles de
 * usuarios, se pasa a buscar en el server con debounce, como id-pos.
 */
export default function UserSearch({
  id,
  users,
  value,
  isInvalid,
  onChange,
  onCreated,
  onStartCreate,
  createLabel = defaultCreateLabel,
  detail,
  placeholder = "Busca usuario por nombre, número o DNI",
}: IUserSearchProps) {
  const listId = useId();
  const [term, setTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [createValues, setCreateValues] = useState<IPersonInitialValues | null>(null);
  /* El elegido se edita tocando su card (Thony, 2026-11-07). */
  const [editTarget, setEditTarget] = useState<IUserResource | null>(null);
  /* La lista cargada no trae el DNI: uno completo se busca en el servidor. */
  const documentUserIds = useDocumentUserIds(term);

  /*
    La modal de edición va también cuando hay alguien elegido. Al guardar, la lista se entera
    y la card se actualiza: el elegido se busca por id en esa lista.
  */
  const editModal = onStartCreate ? null : (
    <UserFormModal
      open={editTarget !== null}
      user={editTarget ?? undefined}
      onSaved={(saved) => onCreated?.(saved)}
      onClose={() => setEditTarget(null)}
    />
  );

  if (value) {
    return (
      <>
      {/* Tono de marca y sin sombra: se distingue de las cards de producto del catálogo. */}
      <div className="flex items-center gap-3 rounded-lg bg-primary/8 px-3 py-2 ring-1 ring-primary/20">
        {/* `div` con rol de botón: adentro van párrafos, que un `<button>` no admite. */}
        <div
          role={onStartCreate ? undefined : "button"}
          tabIndex={onStartCreate ? undefined : 0}
          title={onStartCreate ? undefined : "Editar usuario"}
          aria-label={onStartCreate ? undefined : `Editar a ${fullName(value)}`}
          onClick={onStartCreate ? undefined : () => setEditTarget(value)}
          onKeyDown={(event) => {
            if (!onStartCreate && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              setEditTarget(value);
            }
          }}
          className={
            onStartCreate
              ? "flex min-w-0 flex-1 items-center gap-3"
              : "-m-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md p-1 text-left outline-none hover:bg-primary/5 focus-visible:ring-4 focus-visible:ring-ring/30"
          }
        >
        <InitialsAvatar name={fullName(value)} color={avatarColorOf(fullName(value))} />
        <div className="min-w-0 flex-1">
          {/*
            Hasta dos líneas (Thony, 2026-11-08): con `truncate` el nombre largo no se cortaba,
            ensanchaba la columna del formulario y la card se salía. Al partir el texto, la card
            se queda en el ancho del campo.
          */}
          <p className="line-clamp-2 font-heading font-medium wrap-anywhere text-foreground">{fullName(value)}</p>
          {/* El barrio, no el número (Thony, 2026-11-07); sin barrio no se pone nada. */}
          {detail && <p className="text-sm text-muted-foreground tabular-nums">{detail}</p>}
          {value.neighborhood && <NeighborhoodBadge neighborhood={value.neighborhood} />}
        </div>
        </div>
        <IconButton label="Cambiar de usuario" onClick={() => onChange(null)}>
          <X />
        </IconButton>
      </div>
      {editModal}
      </>
    );
  }

  const normalizedTerm = term.trim().toLowerCase();
  const results = normalizedTerm
    ? users
        .filter((user) => documentUserIds.includes(user.id) || matchesUserSearch(user, normalizedTerm))
        .slice(0, MAX_RESULTS)
    : [];
  const isListShown = isOpen && normalizedTerm.length > 0;

  const choose = (user: IUserResource) => {
    onChange(user);
    setTerm("");
    setIsOpen(false);
  };

  const openCreate = () => {
    const typed = term.trim();
    /* Ocho dígitos es un DNI: se pregunta antes que el teléfono, que también son dígitos. */
    const values: IPersonInitialValues = looksLikeDocumentNumber(typed)
      ? { documentNumber: typed }
      : looksLikePhone(typed)
        ? { phone: phoneOfTyped(typed) }
        : { firstName: typed };
    setIsOpen(false);
    if (onStartCreate) {
      setTerm("");
      onStartCreate(values);
      return;
    }
    setCreateValues(values);
  };

  /* Enter elige el primero; si no hay ninguno, abre crear. */
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && normalizedTerm) {
      event.preventDefault();
      const [first] = results;
      if (first) {
        choose(first);
      } else {
        openCreate();
      }
    }
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="relative">
        <SearchInput
          id={id}
          icon={UserRound}
          isCompact
          placeholder={placeholder}
          aria-label="Buscar usuario por nombre, número, usuario o DNI"
          aria-expanded={isListShown}
          aria-controls={listId}
          aria-invalid={isInvalid}
          autoComplete="off"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          /* Cerrar después del clic en un resultado, no antes. */
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={handleKeyDown}
        />

        {isListShown && (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl bg-popover p-1.5 shadow-elevated"
          >
            <li role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={openCreate}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left font-semibold text-primary transition-colors hover:bg-muted"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Plus className="size-5" />
                </span>
                <span className="truncate">{createLabel(term.trim())}</span>
              </button>
            </li>
            {results.map((user) => (
              <li key={user.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(user)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <InitialsAvatar name={fullName(user)} color={avatarColorOf(fullName(user))} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">{fullName(user)}</span>
                    {user.phone && (
                      <span className="block truncate text-muted-foreground tabular-nums">
                        +{user.phone.countryPrefix} {user.phone.number}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-3 py-2.5 text-muted-foreground">Ningún usuario con «{term.trim()}»</li>
            )}
          </ul>
        )}
      </div>

      {!onStartCreate && (
      <UserFormModal
        open={createValues !== null}
        initialValues={createValues ?? undefined}
        onSaved={(created) => {
          onCreated?.(created);
          choose(created);
        }}
        onClose={() => setCreateValues(null)}
      />
      )}
    </>
  );
}
