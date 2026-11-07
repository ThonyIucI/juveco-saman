import { IconButton } from "@juveco/ui/components/icon-button";
import type { IUserResource } from "@juveco/shared/users";
import { fullName } from "@juveco/shared/people";
import { Plus, UserRound, X } from "lucide-react";
import { type KeyboardEvent, useId, useState } from "react";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import SearchInput from "@/common/components/search-input";
import type { IPersonInitialValues } from "@/common/utils/person-form";
import { looksLikePhone, matchesUserSearch } from "@/modules/users/utils/user-search";

import UserFormModal from "./user-form-modal";
import UserWhatsAppValue from "./user-whatsapp-value";

/* Más resultados no ayudan: si no está entre los primeros, se escribe más. */
const MAX_RESULTS = 6;

interface IUserSearchProps {
  /** Para que un `<Label htmlFor>` apunte al buscador. */
  id?: string;
  users: IUserResource[];
  /** El elegido; `null` muestra el buscador. */
  value: IUserResource | null;
  isInvalid?: boolean;
  onChange: (user: IUserResource | null) => void;
  /** Uno creado desde acá: la lista de usuarios se entera. */
  onCreated: (user: IUserResource) => void;
}

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
}: IUserSearchProps) {
  const listId = useId();
  const [term, setTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [createValues, setCreateValues] = useState<IPersonInitialValues | null>(null);

  if (value) {
    return (
      /* Tono de marca y sin sombra: se distingue de las cards de producto del catálogo. */
      <div className="flex items-center gap-3 rounded-lg bg-primary/8 px-3 py-2 ring-1 ring-primary/20">
        <InitialsAvatar name={fullName(value)} color={avatarColorOf(fullName(value))} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading font-semibold text-foreground">{fullName(value)}</p>
          <UserWhatsAppValue user={value} />
        </div>
        <IconButton label="Cambiar de usuario" onClick={() => onChange(null)}>
          <X />
        </IconButton>
      </div>
    );
  }

  const normalizedTerm = term.trim().toLowerCase();
  const results = normalizedTerm
    ? users.filter((user) => matchesUserSearch(user, normalizedTerm)).slice(0, MAX_RESULTS)
    : [];
  const isListShown = isOpen && normalizedTerm.length > 0;

  const choose = (user: IUserResource) => {
    onChange(user);
    setTerm("");
    setIsOpen(false);
  };

  const openCreate = () => {
    const typed = term.trim();
    setCreateValues(looksLikePhone(typed) ? { phoneNumber: typed.replace(/\D/g, "") } : { firstName: typed });
    setIsOpen(false);
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
          placeholder="Busca usuario por nombre o número"
          aria-label="Buscar usuario por nombre, número o usuario"
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
                <span className="truncate">Crear «{term.trim()}»</span>
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

      <UserFormModal
        open={createValues !== null}
        initialValues={createValues ?? undefined}
        onSaved={(created) => {
          onCreated(created);
          choose(created);
        }}
        onClose={() => setCreateValues(null)}
      />
    </>
  );
}
