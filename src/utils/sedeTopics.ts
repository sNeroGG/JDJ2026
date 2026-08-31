export const SEDE_TOPICS = [
  {
    path: "/comisiones",
    title: "Comisiones",
    description:
      "Las comisiones de la JDJ Jayaque 2026: logística, pastoral, animación y comunicación.",
  },
  {
    path: "/agenda",
    title: "Agenda",
    description:
      "Agenda de la JDJ Jayaque 2026 en la Parroquia San Cristóbal, sábado 14 de noviembre.",
  },
  {
    path: "/ministerios",
    title: "Ministerios",
    description:
      "Los ministerios de la JDJ Jayaque 2026: Corazón Inquieto, Angelus, Proyecto Católico y Ministerio Pro Deo.",
  },
  {
    path: "/voluntarios",
    title: "Voluntarios",
    description:
      "Voluntariado de la JDJ Jayaque 2026. Cómo sumarte al equipo del encuentro.",
  },
] as const;

export type SedeTopicPath = (typeof SEDE_TOPICS)[number]["path"];

export function isSedeTopicPath(pathname: string): pathname is SedeTopicPath {
  return SEDE_TOPICS.some((topic) => topic.path === pathname);
}

export function sedeTopicByPath(pathname: string) {
  return SEDE_TOPICS.find((topic) => topic.path === pathname) ?? null;
}
