import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface IErrorScreenProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Un ícono que gira (p. ej. al recargar) en vez del estático. */
  isIconSpinning?: boolean;
  /** Los botones de salida («Volver al inicio», «Recargar»). */
  children?: ReactNode;
}

/**
 * Pantalla de error a página completa: la 404 y la de «algo salió mal» comparten esta forma
 * (card centrada con ícono, título, explicación y la salida), como en el saas.
 */
export default function ErrorScreen({
  icon: Icon,
  title,
  description,
  isIconSpinning = false,
  children,
}: IErrorScreenProps) {
  return (
    <div className="flex min-h-[70svh] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-card p-8 text-center shadow-card"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/20 text-gold-foreground">
          <Icon
            aria-hidden
            className={isIconSpinning ? "size-8 animate-spin motion-reduce:animate-none" : "size-8"}
            strokeWidth={2}
          />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {children && <div className="flex w-full flex-col gap-2">{children}</div>}
      </motion.div>
    </div>
  );
}
