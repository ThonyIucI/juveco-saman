import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const WEB_PORT = 3012;
const LOCAL_API_URL = "http://localhost:3013";
const LOCAL_WEB_ORIGIN = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  server: {
    port: WEB_PORT,
    // Sin esto, si el 3012 está ocupado vite salta al 3013 y le roba el puerto a wrangler.
    strictPort: true,
    host: true, // escucha en 0.0.0.0 → accesible desde el celular por la IP de la red
    proxy: {
      // En dev el front habla con la API por el MISMO origen (/api → wrangler dev).
      // Así no hay CORS ni cookies cross-site y funciona igual desde el celular.
      "/api": {
        target: LOCAL_API_URL,
        changeOrigin: true,
        // better-auth valida el header Origin contra trustedOrigins; lo normalizamos
        // para que una visita desde http://192.168.x.x:3012 se vea como localhost.
        headers: { origin: LOCAL_WEB_ORIGIN },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    // Solo en dev: mantener Alt + Shift y hacer clic abre el componente en el editor.
    codeInspectorPlugin({ bundler: "vite", editor: "code" }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Juveco Samán",
        short_name: "Juveco",
        description: "Junta Vecinal Comunal Samán",
        theme_color: "#1C3D96",
        background_color: "#101A3D",
        display: "standalone",
        lang: "es",
      },
      // Íconos pendientes: cuando haya logo, `pnpm --filter web generate-pwa-assets`.
      pwaAssets: { disabled: true },
      devOptions: { enabled: true },
    }),
  ],
});
