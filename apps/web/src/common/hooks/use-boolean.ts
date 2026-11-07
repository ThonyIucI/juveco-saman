import { useState } from "react";

/** Estado de abierto/cerrado con nombre. Evita el `const [x, setX] = useState(false)` suelto. */
export const useBoolean = (initial = false) => {
  const [active, setActive] = useState(initial);

  return {
    active,
    on: () => setActive(true),
    off: () => setActive(false),
    toggle: () => setActive((value) => !value),
    set: setActive,
  };
};
