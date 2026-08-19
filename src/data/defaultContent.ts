export type AccentTone = "orange" | "sky" | "teal" | "green" | "navy";

export type MeaningElement = {
  id: string;
  title: string;
  accent: AccentTone;
  summary: string;
  body: string;
};

export type EventItem = {
  id: string;
  label: string;
  title: string;
  text: string;
};

export type LocationFact = {
  id: string;
  label: string;
  value: string;
};

export type HeroHighlight = {
  id: string;
  label: string;
  value: string;
  href: string;
};

export type SocialLink = {
  id: string;
  name: string;
  handle: string;
  href: string;
};

export type PartnerLogo = {
  id: string;
  name: string;
  src: string;
};

export type CatechesisDoc = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  href: string;
};

export type NavLink = {
  id: string;
  href: string;
  label: string;
};

export type SiteContent = {
  logoUrl: string;
  site: {
    name: string;
    year: string;
    pageTitle: string;
    metaDescription: string;
  };
  hero: {
    slogan: string;
    tagline: string;
    ctaLabel: string;
    ctaHref: string;
    highlights: HeroHighlight[];
  };
  location: {
    eyebrow: string;
    title: string;
    lead: string;
    parishLabel: string;
    parishName: string;
    placeLine: string;
    note: string;
    facts: LocationFact[];
  };
  meaning: {
    eyebrow: string;
    title: string;
    lead: string;
    quote: string;
    elements: MeaningElement[];
  };
  event: {
    eyebrow: string;
    title: string;
    lead: string;
    items: EventItem[];
  };
  partners: {
    eyebrow: string;
    title: string;
    lead: string;
    credit: string;
    logos: PartnerLogo[];
  };
  header: {
    ctaLabel: string;
    ctaHref: string;
    nav: NavLink[];
  };
  catechesis: {
    eyebrow: string;
    title: string;
    lead: string;
    emptyTitle: string;
    emptyText: string;
    ctaLabel: string;
    docs: CatechesisDoc[];
  };
  footer: {
    org: string;
    exploreLabel: string;
    socialLabel: string;
    bottomLeft: string;
    bottomRight: string;
    nav: NavLink[];
    social: SocialLink[];
  };
};

export const STORAGE_KEY = "jdj2026-site-content";
export const AUTH_KEY = "jdj2026-admin-auth";
export const AUTH_SECRET_KEY = "jdj2026-admin-secret";

export const DEFAULT_CONTENT: SiteContent = {
  logoUrl: "/images/logo-principal.png",
  site: {
    name: "JDJ Jayaque",
    year: "2026",
    pageTitle: "JDJ Jayaque 2026",
    metaDescription:
      "JDJ Jayaque 2026 — Jornada Diocesana de la Juventud. Tengan valor y síganme. Arquidiócesis de San Salvador.",
  },
  hero: {
    slogan: "Tengan valor y síganme",
    tagline: "Jornada Diocesana de la Juventud · Arquidiócesis de San Salvador",
    ctaLabel: "Descubrir el encuentro",
    ctaHref: "#donde",
    highlights: [
      { id: "sede", label: "Sede", value: "Jayaque", href: "#donde" },
      {
        id: "parroquia",
        label: "Parroquia",
        value: "San Cristóbal",
        href: "#donde",
      },
      {
        id: "preparacion",
        label: "Prepárate",
        value: "Catequesis",
        href: "/catequesis",
      },
    ],
  },
  location: {
    eyebrow: "Sede 2026",
    title: "Este año la JDJ camina hacia Jayaque",
    lead: "Un encuentro de fe, esperanza y comunidad en las montañas de la Arquidiócesis de San Salvador.",
    parishLabel: "Parroquia sede",
    parishName: "Parroquia San Cristóbal",
    placeLine: "Jayaque, El Salvador",
    note: "La cúpula del logo evoca esta iglesia que abre sus puertas para acoger a la juventud diocesana. Los caminos verdes recuerdan la geografía montañosa del lugar y el itinerario del peregrino.",
    facts: [
      { id: "municipio", label: "Municipio", value: "Jayaque" },
      { id: "departamento", label: "Departamento", value: "La Libertad" },
      {
        id: "organiza",
        label: "Organiza",
        value: "Pastoral Juvenil Arquidiocesana",
      },
    ],
  },
  meaning: {
    eyebrow: "Identidad",
    title: "Significado del logo",
    lead: "Cada elemento cuenta una parte del mensaje: Eucaristía, Iglesia, camino y unidad diocesana.",
    quote: "Tengan valor y síganme",
    elements: [
      {
        id: "eucaristia",
        title: "Eucaristía y mosaico",
        accent: "orange",
        summary: "Centro de la vida cristiana",
        body: "Los rayos naranja y amarillo evocan la Eucaristía como centro de la vida cristiana y fuente de la misión de la Iglesia. Los tonos cálidos también recuerdan la presencia del Espíritu Santo.",
      },
      {
        id: "cielo",
        title: "Cielo y esperanza",
        accent: "sky",
        summary: "Mirada puesta en Dios",
        body: "El azul claro del cielo representa la esperanza, la trascendencia y la invitación a elevar la mirada hacia Dios en el camino de fe de cada joven.",
      },
      {
        id: "cupula",
        title: "Cúpula de San Cristóbal",
        accent: "teal",
        summary: "Iglesia que acoge",
        body: "La cúpula representa la Parroquia San Cristóbal de Jayaque, sede del encuentro, y simboliza a la Iglesia que abre sus puertas para recibir a la juventud.",
      },
      {
        id: "caminos",
        title: "Caminos de Jayaque",
        accent: "green",
        summary: "Geografía y peregrinación",
        body: "Las ondas verdes evocan las montañas de Jayaque y el camino del peregrino: un recorrido que no siempre es fácil y que pide valor para seguir a Cristo.",
      },
      {
        id: "rosario",
        title: "Cuentas del Rosario",
        accent: "navy",
        summary: "17 vicarias unidas",
        body: "Las 17 cuentas blancas representan el Santo Rosario que acompaña a los jóvenes y, a la vez, las 17 vicarias que conforman la Arquidiócesis de San Salvador.",
      },
    ],
  },
  event: {
    eyebrow: "El encuentro",
    title: "Información de la JDJ 2026",
    lead: "Lo esencial para empezar a prepararte y acompañar este camino diocesano.",
    items: [
      {
        id: "que-es",
        label: "Qué es",
        title: "Jornada Diocesana de la Juventud",
        text: "Un espacio de encuentro, oración, formación y envío para los jóvenes de la Arquidiócesis de San Salvador.",
      },
      {
        id: "lema",
        label: "Lema 2026",
        title: "Tengan valor y síganme",
        text: "Una invitación a caminar con decisión detrás de Cristo, con la comunidad y con el corazón abierto a la misión.",
      },
      {
        id: "para-quien",
        label: "Para quién",
        title: "Juventud arquidiocesana",
        text: "Adolescentes y jóvenes de las 17 vicarias, grupos parroquiales, movimientos y comunidades eclesiales.",
      },
      {
        id: "prepararte",
        label: "Cómo prepararte",
        title: "Camina con tu parroquia",
        text: "Mantente atento a las convocatorias de tu Pastoral Juvenil parroquial y vicarial. Pronto compartiremos fechas e inscripción.",
      },
    ],
  },
  partners: {
    eyebrow: "Acompañan",
    title: "Logos institucionales",
    lead: "Logos institucionales creados por la Arquidiócesis de San Salvador, El Salvador.",
    credit: "Arquidiócesis de San Salvador · El Salvador",
    logos: [],
  },
  header: {
    ctaLabel: "Catequesis",
    ctaHref: "/catequesis",
    nav: [
      { id: "nav-sede", href: "#donde", label: "Sede" },
      { id: "nav-evento", href: "#evento", label: "Evento" },
      { id: "nav-catequesis", href: "/catequesis", label: "Catequesis" },
    ],
  },
  catechesis: {
    eyebrow: "Preparación",
    title: "Catequesis para el encuentro",
    lead: "Aquí encontrarás los documentos para prepararte con tu parroquia, grupo o vicaría rumbo a la JDJ 2026.",
    emptyTitle: "Los materiales se publicarán pronto",
    emptyText:
      "Estamos reuniendo las catequesis de preparación. Vuelve a esta página para descargar guías, fichas y recursos del camino hacia Jayaque.",
    ctaLabel: "Ver documentos",
    docs: [],
  },
  footer: {
    org: "Pastoral Juvenil · Arquidiócesis de San Salvador",
    exploreLabel: "Explorar",
    socialLabel: "Redes oficiales",
    bottomLeft: "JDJ Jayaque 2026",
    bottomRight: "Arquidiócesis de San Salvador, El Salvador",
    nav: [
      { id: "nav-sede", href: "#donde", label: "Sede" },
      { id: "nav-logo", href: "#significado", label: "Logo" },
      { id: "nav-evento", href: "#evento", label: "Evento" },
      { id: "nav-catequesis", href: "/catequesis", label: "Catequesis" },
      { id: "nav-logos", href: "#auspiciadores", label: "Logos" },
    ],
    social: [
      {
        id: "instagram",
        name: "Instagram",
        handle: "@pjarqui_ss",
        href: "https://www.instagram.com/pjarqui_ss/",
      },
      {
        id: "facebook",
        name: "Facebook",
        handle: "Pastoral Juvenil",
        href: "https://www.facebook.com/search/top/?q=Pastoral%20Juvenil%20Arquidi%C3%B3cesis%20de%20San%20Salvador",
      },
      {
        id: "youtube",
        name: "YouTube",
        handle: "Arquidiócesis SS",
        href: "https://www.youtube.com/results?search_query=Arquidi%C3%B3cesis+de+San+Salvador",
      },
    ],
  },
};
