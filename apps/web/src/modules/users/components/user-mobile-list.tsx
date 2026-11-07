import type { IUserResource } from "@juveco/shared/users";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { IRowAction } from "@/common/components/row-actions";
import { EASE_OUT } from "@/common/constants/motion";

import UserCard, { UserCardSkeleton } from "./user-card";

const SKELETON_COUNT = 3;
const STAGGER_SECONDS = 0.04;
const MAX_STAGGERED = 8;

interface IUserMobileListProps {
  users: IUserResource[];
  isLoading: boolean;
  buildActions: (user: IUserResource) => IRowAction[];
  onOpen: (user: IUserResource) => void;
}

/** Cards en celular. Oculta desde `md`: allí se usa `UserTable`. */
export default function UserMobileList({
  users,
  isLoading,
  buildActions,
  onOpen,
}: IUserMobileListProps) {
  const prefersReducedMotion = useReducedMotion();

  if (isLoading) {
    return (
      <ul className="space-y-3 md:hidden">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <li key={index}>
            <UserCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-3 md:hidden">
      <AnimatePresence initial={false} mode="popLayout">
        {users.map((user, index) => (
          <motion.li
            key={user.id}
            layout
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(8px)" }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.97)" }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.22,
              ease: EASE_OUT,
              delay: prefersReducedMotion ? 0 : Math.min(index, MAX_STAGGERED) * STAGGER_SECONDS,
            }}
          >
            <UserCard
              user={user}
              actions={buildActions(user)}
              onOpen={() => onOpen(user)}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
