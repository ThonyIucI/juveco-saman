/** Baja hasta una sección; suave, salvo que el sistema pida menos movimiento. */
export const scrollToSection = (id: string) => {
  const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: isReduced ? "auto" : "smooth", block: "start" });
};
