import type { IPublicProject } from "@juveco/shared/public";
import { activityTypeLabels } from "@juveco/shared/activities";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { EASE_OUT } from "@/common/constants/motion";
import { ACTIVITY_ICONS } from "@/modules/public/utils/activity-icons";
import { nextActivityOf } from "@/modules/public/utils/activity-links";
import { formatWeekdayLong } from "@/modules/public/utils/event-dates";

import ActivityLink from "./activity-link";

const DISMISSED_KEY = "juveco:upcoming-notice-dismissed";
/* El carrusel de la portada: el aviso aparece cuando ya se pasó. */
const CAROUSEL_ID = "inicio";

const readDismissed = (): boolean => {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
};

const saveDismissed = () => {
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    /* Sin almacenamiento, el aviso solo se cierra mientras la página siga abierta. */
  }
};

/** Si ya se bajó más allá del carrusel. */
const useHasPassedCarousel = (): boolean => {
  const [hasPassed, setHasPassed] = useState(false);

  useEffect(() => {
    const carousel = document.getElementById(CAROUSEL_ID);
    if (!carousel) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setHasPassed(entry !== undefined && !entry.isIntersecting && entry.boundingClientRect.bottom < 0);
    });
    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  return hasPassed;
};

/**
 * Aviso flotante de lo próximo (Thony, 2026-11-25): una pastilla abajo con la actividad más
 * cercana que aún no pasa. Aparece al pasar el carrusel, lleva a su página y se puede cerrar;
 * cerrada, no vuelve en esa sesión. Solo en el inicio.
 */
export default function UpcomingNotice({ event }: { event: IPublicProject }) {
  const isReduced = useReducedMotion() ?? false;
  const hasPassedCarousel = useHasPassedCarousel();
  const [isDismissed, setIsDismissed] = useState(readDismissed);
  const next = nextActivityOf(event.activities);

  if (!next) {
    return null;
  }
  const Icon = ACTIVITY_ICONS[next.activity.type];
  const isVisible = hasPassedCarousel && !isDismissed;

  const dismiss = () => {
    saveDismissed();
    setIsDismissed(true);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 md:justify-end md:px-6">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: isReduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isReduced ? 0 : 16 }}
            transition={{ duration: isReduced ? 0 : 0.25, ease: EASE_OUT }}
            className="pointer-events-auto flex max-w-full items-center rounded-full bg-[#14214A] text-white shadow-elevated"
          >
            <ActivityLink
              activity={next.activity}
              className="flex min-h-11 min-w-0 items-center gap-2 rounded-full py-1 pr-1 pl-4 text-sm font-medium hover:text-gold"
            >
              <Icon aria-hidden className="size-4 shrink-0 text-gold" />
              <span className="truncate">
                {activityTypeLabels[next.activity.type]}, {formatWeekdayLong(next.date)}
              </span>
            </ActivityLink>
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={dismiss}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:text-white"
            >
              <X aria-hidden className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
