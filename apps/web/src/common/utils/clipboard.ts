import { toast } from "sonner";

import { ApiError } from "@/lib/api";

const FAILED_MESSAGE = "No pudimos copiar. Mantén presionado el texto para copiarlo a mano.";
const UNEXPECTED_MESSAGE = "No pudimos traer lo que había que copiar. Intenta de nuevo.";

/**
 * Copia seleccionando el texto en la página y usando `execCommand("copy")`. Es la forma
 * vieja, pero funciona donde `navigator.clipboard` no existe: fuera de HTTPS, como al abrir
 * `pnpm dev` desde el celular por la IP de la red (`http://192.168…`).
 *
 * Se selecciona un `<span>` y no un `<textarea>`: en iPhone, enfocar un campo abre el
 * teclado y hace zoom, y la selección de un campo de solo lectura no siempre se copia.
 */
const copyBySelection = (text: string): boolean => {
  const span = document.createElement("span");
  span.textContent = text;
  span.style.position = "fixed";
  span.style.top = "0";
  span.style.opacity = "0";
  span.style.whiteSpace = "pre";
  span.style.userSelect = "text";
  span.style.webkitUserSelect = "text";
  document.body.appendChild(span);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(span);
  selection?.removeAllRanges();
  selection?.addRange(range);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    selection?.removeAllRanges();
    span.remove();
  }
};

const hasClipboardApi = (): boolean => Boolean(navigator.clipboard) && window.isSecureContext;

/**
 * Texto que todavía llega del server (p. ej. el acceso de una cuenta, que necesita la
 * contraseña). En iPhone, copiar **después** de esperar la red falla: el navegador ya no lo
 * cuenta como parte del toque. Con un `ClipboardItem` que recibe la promesa, la copia se
 * pide en el mismo toque y el texto llega después. Funciona en Safari y en Chrome.
 */
const copyPending = async (pending: Promise<string>): Promise<boolean> => {
  if (hasClipboardApi() && typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
    try {
      const blob = pending.then((text) => new Blob([text], { type: "text/plain" }));
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      return true;
    } catch {
      /* Si falló el pedido al server, el error sale abajo, al esperar `pending`. */
    }
  }
  return copyText(await pending);
};

const copyText = async (text: string): Promise<boolean> => {
  if (hasClipboardApi()) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* Se prueba la otra forma. */
    }
  }
  return copyBySelection(text);
};

/**
 * Copia al portapapeles y avisa con un toast. Devuelve si se pudo. Acepta el texto ya
 * listo o una promesa (lo que todavía viene del server). Si el server falla, se muestra
 * su mensaje; si el navegador no deja copiar, se avisa en español.
 */
export const copyToClipboard = async (
  text: string | Promise<string>,
  /** `null`: sin toast de éxito (lo muestra el botón, p. ej. `CopyButton` con su check). */
  successMessage: string | null = "Copiado",
): Promise<boolean> => {
  let isCopied = false;
  try {
    isCopied = typeof text === "string" ? await copyText(text) : await copyPending(text);
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : UNEXPECTED_MESSAGE);
    return false;
  }

  if (isCopied) {
    if (successMessage !== null) {
      toast.success(successMessage);
    }
  } else {
    toast.error(FAILED_MESSAGE);
  }
  return isCopied;
};
