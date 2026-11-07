import { type IActivityItemResource, normalizeItemSerial } from "@juveco/shared/activity-items";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { IRowAction } from "@/common/components/row-actions";
import { EASE_OUT } from "@/common/constants/motion";

import ActivityItemCard, { ActivityItemCardSkeleton } from "./activity-item-card";

const SKELETON_COUNT = 8;
const STAGGER_SECONDS = 0.03;
const MAX_STAGGERED = 12;

/* Cards también en escritorio (acordado 2026-11-07): sin tabla. */
const GRID_CLASS = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

interface IActivityItemGridProps {
  items: IActivityItemResource[];
  isLoading: boolean;
  /** Cuántos hay con cada serie en **toda** la actividad, no solo en lo filtrado. */
  serialCounts: Map<string, number>;
  buildActions: (item: IActivityItemResource) => IRowAction[];
}

export default function ActivityItemGrid({ items, isLoading, serialCounts, buildActions }: IActivityItemGridProps) {
  const prefersReducedMotion = useReducedMotion();

  if (isLoading) {
    return (
      <ul className={GRID_CLASS}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <li key={index}>
            <ActivityItemCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={GRID_CLASS}>
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item, index) => {
          const serialCount = serialCounts.get(normalizeItemSerial(item.serial)) ?? 0;

          return (
            <motion.li
              key={item.id}
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
              <ActivityItemCard item={item} isSerialRepeated={serialCount > 1} actions={buildActions(item)} />
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
