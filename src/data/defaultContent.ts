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
  coverUrl?: string;
};

export type InstagramPostItem = {
  url: string;
  imageUrl: string;
};

export type NavLink = {
  id: string;
  href: string;
  label: string;
};

export type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  text: string;
};

export type RegistrationStatus = "soon" | "open" | "closed";

export type RegistrationStep = {
  id: string;
  title: string;
  text: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type Vicariate = {
  id: string;
  name: string;
  note: string;
};

export type StoreProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  /** 0 = agotado. */
  stock: number;
  sizes: string[];
};

export type StoreOrderStatus = "nuevo" | "atendido" | "cancelado";

export type StoreOrder = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  productId: string;
  productTitle: string;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
  payment: "Transferencia";
  note: string;
  status: StoreOrderStatus;
};

export type SiteContent = {
  logoUrl: string;
  site: {
    name: string;
    year: string;
    pageTitle: string;
    metaDescription: string;
    /** Dominio final sin slash. Si queda vacío se usa el de Vercel al construir. */
    url: string;
    /** Imagen para compartir en WhatsApp y redes (1200×630). */
    ogImage: string;
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
    mapQuery: string;
    mapLat: string;
    mapLng: string;
    mapLabel: string;
    mapNote: string;
    directionsLabel: string;
    wazeLabel: string;
  };
  instagram: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    lead: string;
    handle: string;
    /** 1 a 3 publicaciones: enlace de Instagram e imagen subida en /admin. */
    posts: InstagramPostItem[];
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
  schedule: {
    eyebrow: string;
    title: string;
    lead: string;
    /** Inicio del encuentro en hora de El Salvador, ej. 2026-08-15T08:00. Vacío oculta la cuenta regresiva. */
    startDate: string;
    dateLabel: string;
    countdownEyebrow: string;
    countdownTitle: string;
    countdownLiveText: string;
    countdownDoneText: string;
    items: ScheduleItem[];
  };
  registration: {
    /** Si es false, la sección y el enlace del menú no aparecen en la landing. */
    enabled: boolean;
    eyebrow: string;
    title: string;
    lead: string;
    status: RegistrationStatus;
    statusLabel: string;
    ctaLabel: string;
    ctaHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    note: string;
    steps: RegistrationStep[];
  };
  faq: {
    eyebrow: string;
    title: string;
    lead: string;
    items: FaqItem[];
  };
  vicariates: {
    eyebrow: string;
    title: string;
    lead: string;
    note: string;
    items: Vicariate[];
  };
  partners: {
    eyebrow: string;
    title: string;
    lead: string;
    credit: string;
    logos: PartnerLogo[];
  };
  store: {
    logoUrl: string;
    eyebrow: string;
    title: string;
    lead: string;
    /** Número de WhatsApp con código de país, ej. 50370123456. */
    whatsapp: string;
    paymentNote: string;
    ctaLabel: string;
    products: StoreProduct[];
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
    logoUrl: string;
    org: string;
    exploreLabel: string;
    socialLabel: string;
    bottomLeft: string;
    bottomRight: string;
    nav: NavLink[];
    social: SocialLink[];
  };
};

type DeepPartial<T> = T extends (infer _Item)[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/**
 * Forma del overlay que escribe /admin. Es parcial en profundidad para que
 * agregar campos nuevos al contenido no invalide el archivo ya guardado.
 */
export type SavedContent = DeepPartial<SiteContent>;

export const AUTH_KEY = "jdj2026-admin-auth";
export const AUTH_SECRET_KEY = "jdj2026-admin-secret";
export const AUTH_PUBLISH_KEY = "jdj2026-admin-publish";

export const DEFAULT_CONTENT: SiteContent = {
  logoUrl: "/images/logo-jdj-2026.webp",
  site: {
    name: "JDJ Jayaque",
    year: "2026",
    pageTitle: "JDJ Jayaque 2026",
    metaDescription:
      "JDJ Jayaque 2026 — Jornada Diocesana de la Juventud. Tengan valor y síganme. Arquidiócesis de San Salvador.",
    url: "",
    ogImage: "/images/og-jdj-2026.jpg",
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
        id: "fecha",
        label: "Fecha",
        value: "14 nov 2026",
        href: "",
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
    mapQuery: "Parroquia San Cristóbal, Jayaque, La Libertad, El Salvador",
    mapLat: "",
    mapLng: "",
    mapLabel: "Ver el mapa",
    mapNote:
      "El mapa se carga solo cuando lo pides, para no gastar tus datos de más.",
    directionsLabel: "Abrir en Google Maps",
    wazeLabel: "Abrir en Waze",
  },
  instagram: {
    enabled: true,
    eyebrow: "Instagram",
    title: "Últimas publicaciones",
    lead: "Lo más reciente de Pastoral Juvenil Arquidiocesana.",
    handle: "pjarqui_ss",
    posts: [],
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
        id: "cuando",
        label: "Cuándo",
        title: "14 de noviembre de 2026",
        text: "Un sábado para encontrarnos en Jayaque. La cuenta regresiva ya está en esta página.",
      },
    ],
  },
  schedule: {
    eyebrow: "Agenda",
    title: "El camino hacia el encuentro",
    lead: "Aquí publicaremos el programa de la jornada, hora por hora, para que llegues preparado.",
    startDate: "2026-11-14T08:00",
    dateLabel: "14 de noviembre de 2026",
    countdownEyebrow: "Cuenta regresiva",
    countdownTitle: "Faltan",
    countdownLiveText: "¡Estamos viviendo la JDJ 2026!",
    countdownDoneText: "Gracias por caminar con nosotros en la JDJ 2026.",
    items: [],
  },
  registration: {
    enabled: false,
    eyebrow: "Inscripción",
    title: "Prepara tu lugar en la JDJ 2026",
    lead: "La inscripción se hace acompañado de tu parroquia o vicaría. Así llegamos como comunidad y no como visitantes sueltos.",
    status: "soon",
    statusLabel: "Inscripciones pronto",
    ctaLabel: "",
    ctaHref: "",
    secondaryLabel: "",
    secondaryHref: "",
    note: "Cuando abramos la inscripción, el enlace aparecerá aquí y en nuestras redes oficiales.",
    steps: [
      {
        id: "paso-parroquia",
        title: "Habla con tu Pastoral Juvenil",
        text: "Acércate al equipo de tu parroquia o vicaría para caminar con tu grupo hacia Jayaque.",
      },
      {
        id: "paso-catequesis",
        title: "Vive las catequesis",
        text: "Descarga los materiales de preparación y trabájalos en comunidad antes del encuentro.",
      },
      {
        id: "paso-datos",
        title: "Ten listos tus datos",
        text: "Nombre completo, edad, parroquia y un contacto de emergencia agilizan tu registro.",
      },
    ],
  },
  faq: {
    eyebrow: "Preguntas frecuentes",
    title: "Lo que más nos preguntan",
    lead: "Si tu duda no está aquí, escríbenos por nuestras redes oficiales.",
    items: [
      {
        id: "faq-que-es",
        question: "¿Qué es la JDJ?",
        answer:
          "La Jornada Diocesana de la Juventud es el encuentro anual de la juventud de la Arquidiócesis de San Salvador: un día de oración, formación, fiesta y envío misionero.",
      },
      {
        id: "faq-quien",
        question: "¿Quién puede participar?",
        answer:
          "Adolescentes y jóvenes de las 17 vicarías, grupos parroquiales, movimientos y comunidades eclesiales de la Arquidiócesis.",
      },
      {
        id: "faq-donde",
        question: "¿Dónde será la JDJ 2026?",
        answer:
          "En Jayaque, La Libertad, con la Parroquia San Cristóbal como sede del encuentro.",
      },
      {
        id: "faq-cuando",
        question: "¿Cuándo es la JDJ 2026?",
        answer:
          "El sábado 14 de noviembre de 2026, en Jayaque, La Libertad, con la Parroquia San Cristóbal como sede.",
      },
      {
        id: "faq-preparar",
        question: "¿Cómo me preparo?",
        answer:
          "Descarga las catequesis de preparación y trabájalas con tu grupo. Cada material está pensado para vivirse en comunidad, no solo para leerse.",
      },
    ],
  },
  vicariates: {
    eyebrow: "Arquidiócesis",
    title: "Las 17 vicarías caminan juntas",
    lead: "Cada cuenta blanca del logo representa una vicaría de la Arquidiócesis de San Salvador.",
    note: "Agrega las vicarías desde el panel para mostrarlas aquí.",
    items: [],
  },
  partners: {
    eyebrow: "Acompañan",
    title: "Logos institucionales",
    lead: "Logos institucionales creados por la Arquidiócesis de San Salvador, El Salvador.",
    credit: "Arquidiócesis de San Salvador · El Salvador",
    logos: [],
  },
  store: {
    logoUrl: "",
    eyebrow: "Tienda JDJ",
    title: "Lleva el encuentro contigo",
    lead: "Camisas y recuerdos de la JDJ 2026. Pides por WhatsApp y pagas por transferencia.",
    whatsapp: "",
    paymentNote:
      "El pago es por transferencia. Al enviar el pedido por WhatsApp te compartimos los datos bancarios para completar la compra.",
    ctaLabel: "Pedir por WhatsApp",
    products: [],
  },
  header: {
    ctaLabel: "Catequesis",
    ctaHref: "/catequesis",
    nav: [
      { id: "nav-sede", href: "#donde", label: "Sede" },
      { id: "nav-evento", href: "#evento", label: "Evento" },
      { id: "nav-agenda", href: "#agenda", label: "Agenda" },
      { id: "nav-inscripcion", href: "#inscripcion", label: "Inscripción" },
      { id: "nav-tienda", href: "/tienda", label: "Tienda" },
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
    logoUrl: "/images/logo-pja.webp",
    org: "Pastoral Juvenil · Arquidiócesis de San Salvador",
    exploreLabel: "Explorar",
    socialLabel: "Redes oficiales",
    bottomLeft: "JDJ Jayaque 2026",
    bottomRight: "Arquidiócesis de San Salvador, El Salvador",
    nav: [
      { id: "nav-sede", href: "#donde", label: "Sede" },
      { id: "nav-logo", href: "#significado", label: "Logo" },
      { id: "nav-evento", href: "#evento", label: "Evento" },
      { id: "nav-agenda", href: "#agenda", label: "Agenda" },
      { id: "nav-inscripcion", href: "#inscripcion", label: "Inscripción" },
      { id: "nav-tienda", href: "/tienda", label: "Tienda" },
      { id: "nav-catequesis", href: "/catequesis", label: "Catequesis" },
      { id: "nav-faq", href: "#faq", label: "Preguntas" },
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
