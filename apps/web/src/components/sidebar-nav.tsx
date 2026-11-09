import { cn } from "@juveco/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import {
  type INavGroup,
  type INavItem,
  type TSidebarEntry,
  isNavGroup,
} from "@/common/constants/routes";
import { EASE_OUT } from "@/common/constants/motion";
import { useSectionLinkClick } from "@/common/hooks/use-section-link-click";

const LINK_CLASS =
  "flex items-center gap-3 rounded-xl px-3 py-3 font-heading text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary";

interface ISidebarLinkProps {
  item: INavItem;
  isNested?: boolean;
  onNavigate?: () => void;
}

function SidebarLink({ item, isNested = false, onNavigate }: ISidebarLinkProps) {
  const { to, label, icon: Icon } = item;
  const handleSectionClick = useSectionLinkClick();
  return (
    <Link
      to={to}
      onClick={handleSectionClick(to, onNavigate)}
      className={cn(LINK_CLASS, isNested && "py-2.5 pl-11 text-[0.95rem]")}
    >
      <Icon className={cn("size-5", isNested && "size-4.5")} />
      {label}
    </Link>
  );
}

interface ISidebarGroupProps {
  group: INavGroup;
  onNavigate?: () => void;
}

/**
 * Un grupo con submenú (p. ej. Compras → Proveedores, Cuentas). Arranca abierto si se está
 * en uno de sus módulos, así no queda escondido dónde se está.
 */
function SidebarGroup({ group, onNavigate }: ISidebarGroupProps) {
  const prefersReducedMotion = useReducedMotion();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hasActiveChild = group.items.some((item) => pathname.startsWith(item.to));
  const [isExpanded, setIsExpanded] = useState(hasActiveChild);
  const { icon: Icon } = group;

  /* Al entrar a uno de sus módulos desde otro lado, el grupo se abre. Se puede cerrar igual. */
  useEffect(() => {
    if (hasActiveChild) {
      setIsExpanded(true);
    }
  }, [hasActiveChild]);

  return (
    <li>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((open) => !open)}
        className={cn(LINK_CLASS, "w-full cursor-pointer", hasActiveChild && "text-foreground")}
      >
        <Icon className="size-5" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={cn("size-4 transition-transform duration-200", isExpanded && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.ul
            className="space-y-1 overflow-hidden pt-1"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: EASE_OUT }}
          >
            {group.items.map((item) => (
              <li key={item.to}>
                <SidebarLink item={item} isNested onNavigate={onNavigate} />
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

interface ISidebarNavProps {
  entries: readonly TSidebarEntry[];
  /** En celular: cerrar el panel al elegir un módulo. */
  onNavigate?: () => void;
}

/** Los módulos del menú lateral: enlaces sueltos y grupos con submenú. */
export default function SidebarNav({ entries, onNavigate }: ISidebarNavProps) {
  return (
    <ul className="space-y-1">
      {entries.map((entry) =>
        isNavGroup(entry) ? (
          <SidebarGroup key={entry.label} group={entry} onNavigate={onNavigate} />
        ) : (
          <li key={entry.to}>
            <SidebarLink item={entry} onNavigate={onNavigate} />
          </li>
        ),
      )}
    </ul>
  );
}
