export const SEDE_TOPICS = [
  {
    path: "/comisiones",
    title: "Comisiones",
    description:
      "Apartado de las comisiones de la JDJ Jayaque 2026. Pronto publicaremos más información.",
  },
  {
    path: "/agenda",
    title: "Agenda",
    description:
      "Apartado de la agenda de la JDJ Jayaque 2026. Pronto publicaremos más información.",
  },
  {
    path: "/ministerios",
    title: "Ministerios",
    description:
      "Apartado de los ministerios de la JDJ Jayaque 2026. Pronto publicaremos más información.",
  },
  {
    path: "/voluntarios",
    title: "Voluntarios",
    description:
      "Apartado de voluntarios de la JDJ Jayaque 2026. Pronto publicaremos más información.",
  },
] as const;

export type SedeTopicPath = (typeof SEDE_TOPICS)[number]["path"];

export function isSedeTopicPath(pathname: string): pathname is SedeTopicPath {
  return SEDE_TOPICS.some((topic) => topic.path === pathname);
}

export function sedeTopicByPath(pathname: string) {
  return SEDE_TOPICS.find((topic) => topic.path === pathname) ?? null;
}
