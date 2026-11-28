import { createFileRoute } from "@tanstack/react-router";

import SiteFooter from "@/modules/public/components/site-footer";
import SiteNavbar from "@/modules/public/components/site-navbar";
import { SITE } from "@/modules/public/data/site";

export const Route = createFileRoute("/privacidad")({
  component: PrivacyPage,
});

const SECTIONS = [
  {
    title: "Qué datos recogemos",
    body: "Para el empadronamiento registramos nombres y apellidos, DNI, fecha de nacimiento, género, condiciones de prioridad (gestante, discapacidad, entre otras), un teléfono de contacto, la ubicación de la vivienda y fotos de la vivienda.",
  },
  {
    title: "Para qué los usamos",
    body: "Solo para organizar la ayuda y los programas de apoyo al pueblo de Samán: donaciones, apoyo ante desastres, útiles escolares, herramientas y otros. No los vendemos ni los usamos con fines comerciales.",
  },
  {
    title: "Quién los ve",
    body: "Solo los miembros de la directiva con acceso al panel. Los datos sensibles (DNI, fecha de nacimiento y condiciones) nunca se muestran en la página pública. Podemos compartir la lista con autoridades o instituciones únicamente para entregar una ayuda.",
  },
  {
    title: "Dónde se guardan",
    body: "En nuestra base de datos en Cloudflare. Las fotos de las viviendas se guardan en una carpeta privada de Google Drive de la junta; la aplicación solo accede a los archivos que ella misma crea.",
  },
  {
    title: "Tus derechos",
    body: "Puedes pedir ver, corregir o borrar tus datos escribiéndonos por nuestras redes o acercándote a la directiva.",
  },
] as const;

/** Política de privacidad: la pide Google para publicar el acceso a Drive y la exige el censo. */
function PrivacyPage() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-background">
      <SiteNavbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-6 md:py-12">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Política de privacidad</h1>
        <p className="mt-1 mb-8 text-base text-muted-foreground">{SITE.fullName}</p>
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
