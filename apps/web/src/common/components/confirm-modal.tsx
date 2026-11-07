import { Button } from "@juveco/ui/components/button";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { useMediaQuery } from "@/common/hooks/use-media-query";

const DESKTOP_QUERY = "(min-width: 640px)";

interface IConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `destructive` para lo que no se deshace de un clic. */
  variant?: "default" | "destructive";
  loading?: boolean;
  /** Solo avisa: un único botón (`confirmLabel`, p. ej. «Entendido»), sin cancelar. */
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmación estándar. **Nunca** usar `window.confirm()`.
 *
 * En celular es una hoja de acción abajo, con el botón principal pegado al cuerpo y el
 * secundario flotando aparte: así el pulgar no se equivoca de botón. En escritorio
 * colapsa a una tarjeta centrada con los dos en fila.
 */
/* Los botones nunca se apagan (regla 2026-10-13): mientras confirma, un clic más no hace nada. */
export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  loading = false,
  hideCancel = false,
  onConfirm,
  onCancel,
}: IConfirmModalProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };
  const handleCancel = () => {
    if (!loading) {
      onCancel();
    }
  };
  const prefersReducedMotion = useReducedMotion();

  const hidden = prefersReducedMotion
    ? { opacity: 0 }
    : isDesktop
      ? { opacity: 0, scale: 0.96 }
      : { opacity: 0, y: "100%" };

  const visible = prefersReducedMotion
    ? { opacity: 1 }
    : isDesktop
      ? { opacity: 1, scale: 1 }
      : { opacity: 1, y: 0 };

  return (
    <AnimatePresence>
      {open && (
        /* z-60: una confirmación puede abrirse encima de una modal de formulario. */
        <motion.div
          className="fixed inset-0 z-60 flex items-end justify-center bg-foreground/50 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCancel();
            }
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            className="w-full sm:max-w-sm"
            initial={hidden}
            animate={visible}
            exit={{
              ...hidden,
              transition: prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
            }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
          >
            {/* Escritorio: una sola tarjeta con los botones en fila. */}
            <div className="hidden rounded-3xl bg-card p-6 text-foreground shadow-sheet sm:block">
              <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
              {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}

              <div className="mt-5 flex justify-end gap-2">
                {!hideCancel && (
                  <Button variant="outline" onClick={handleCancel}>
                    {cancelLabel}
                  </Button>
                )}
                <Button variant={variant} onClick={handleConfirm}>
                  {loading && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                  {confirmLabel}
                </Button>
              </div>
            </div>

            {/* Celular: hoja de acción. Cuerpo y botón principal juntos; cancelar aparte. */}
            <div className="flex flex-col gap-2 sm:hidden">
              <div className="overflow-hidden rounded-3xl bg-card text-foreground shadow-sheet">
                <div className="px-6 pt-7 pb-5 text-center">
                  <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
                  {description && (
                    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                <div className="p-3 pt-0">
                  <Button
                    size="xl"
                    variant={variant}
                    className="w-full"
                    onClick={handleConfirm}
                  >
                    {loading && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                    {confirmLabel}
                  </Button>
                </div>
              </div>

              {!hideCancel && (
                <div className="rounded-3xl bg-card p-1.5 shadow-sheet">
                  <Button
                    size="xl"
                    variant="ghost"
                    className="w-full"
                    onClick={handleCancel}
                  >
                    {cancelLabel}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
