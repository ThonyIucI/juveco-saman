import type { LucideIcon } from "lucide-react";
import { Hammer, HeartHandshake, PartyPopper, ShieldCheck } from "lucide-react";

/**
 * Contenido institucional de la portada (acordado 2026-11-25). Va en código y no en la base:
 * cambia poco y lo edita quien mantiene la página. Lo que falta lo completa Thony acá mismo.
 */
export const SITE = {
  shortName: "Juveco Samán",
  fullName: "Junta Vecinal Comunal Samán",
  term: "Gestión 2026 – 2028",
  intro: "Nos organizamos para sacar adelante obras, actividades y proyectos para Samán.",
  about: [
    "La Juveco es la junta vecinal comunal de Samán: es elegida por los pobladores para que los represente y busque dar solución a las necesidades del pueblo con apoyo de todos.",
    "Gestionamos obras y servicios ante las autoridades, cuidamos la seguridad de nuestras calles y organizamos actividades para reunir fondos y compartir en comunidad.",
  ],
  /** Usuario de WhatsApp de contacto, sin «@». `null`: el footer va sin contacto. Pendiente (Thony). */
  whatsappUsername: null as string | null,
} as const;

export interface ISiteFunction {
  icon: LucideIcon;
  title: string;
  text: string;
}

/** Lo que hace la Juveco (propuesta del 2026-11-25). */
export const FUNCTIONS: ISiteFunction[] = [
  { icon: Hammer, title: "Obras y servicios", text: "Gestionamos mejoras para el barrio ante la municipalidad y otras instituciones." },
  { icon: ShieldCheck, title: "Seguridad ciudadana", text: "Trabajamos con los vecinos y las autoridades para cuidar nuestras calles." },
  { icon: PartyPopper, title: "Actividades y eventos", text: "Campeonatos, bingos y la chocolatada: reunimos fondos y compartimos en comunidad." },
  { icon: HeartHandshake, title: "Apoyo social", text: "Acompañamos a las familias que más lo necesitan." },
];

export interface IBoardMember {
  role: string;
  name: string;
}

/** Directiva 2026 – 2028, en el orden en que se muestra. Pendiente (Thony): cargos y nombres. */
export const BOARD: IBoardMember[] = [];

export type TSiteProjectStatus = "DONE" | "IN_PROGRESS" | "PLANNED";

export const siteProjectStatusLabels: Record<TSiteProjectStatus, string> = {
  DONE: "Cumplido",
  IN_PROGRESS: "En marcha",
  PLANNED: "Próximo",
};

export interface ISiteProject {
  id: string;
  name: string;
  /** Una o dos líneas. */
  description: string | null;
  /** En `apps/web/public/portada/proyectos/`. */
  image: string;
  /** Dónde se ancla la foto al recortarla con `object-cover`; centro si falta. */
  objectPosition?: string;
  status: TSiteProjectStatus | null;
  /** Rótulo corto sobre quién la hizo, p. ej. «Gestión anterior». */
  tag?: string;
}

const PREVIOUS_TERM_TAG = "Gestión anterior";

/**
 * Proyectos de la Juveco: obras para el barrio. La chocolatada es un evento, no un proyecto
 * (Thony, 2026-11-25). Las sillas de ruedas y las letras son de la gestión pasada: ya están
 * hechas. Pendiente (Thony): descripción y estado de las demás.
 */
export const PROJECTS: ISiteProject[] = [
  { id: "mural", name: "Mural de bienvenida", description: null, image: "/portada/proyectos/mural.webp", status: null },
  {
    id: "camaras",
    name: "Implementación de cámaras de seguridad",
    description: null,
    image: "/portada/proyectos/camaras.webp",
    objectPosition: "center 50%",
    status: null,
  },
  {
    id: "pozo",
    name: "Reactivación del pozo de agua en María Auxiliadora",
    description: null,
    image: "/portada/proyectos/pozo.webp",
    objectPosition: "center 30%",
    status: null,
  },
  {
    id: "sillas",
    name: "Donación de sillas de ruedas",
    description: null,
    image: "/portada/proyectos/sillas.webp",
    status: "DONE",
    tag: PREVIOUS_TERM_TAG,
  },
  {
    id: "letras",
    name: "Letras céntricas",
    description: null,
    image: "/portada/proyectos/letras.webp",
    status: "DONE",
    tag: PREVIOUS_TERM_TAG,
  },
];

export interface IHeroSlide {
  image: string;
  caption: string;
  objectPosition?: string;
}

/** Las seis fotos del carrusel: las de los proyectos y la del monitoreo de las cámaras. */
export const HERO_SLIDES: IHeroSlide[] = [
  ...PROJECTS.map(({ image, name, objectPosition }) => ({ image, caption: name, objectPosition })),
  { image: "/portada/proyectos/monitoreo.webp", caption: "Monitoreo de las cámaras", objectPosition: "center 55%" },
];

/** Enlaces del navbar y del footer: cada uno baja a su sección del inicio. */
export const SITE_SECTIONS = [
  { id: "inicio", label: "Inicio" },
  { id: "nosotros", label: "Nosotros" },
  { id: "proyectos", label: "Proyectos" },
  { id: "evento", label: "Eventos" },
  { id: "siguenos", label: "Síguenos" },
] as const;
