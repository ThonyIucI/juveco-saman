import { defineConfig, minimal2023Preset as preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset,
  // Pendiente: dejar el logo cuadrado en public/logo.png y activar `pwaAssets` en vite.config.ts.
  images: ["public/logo.png"],
});
