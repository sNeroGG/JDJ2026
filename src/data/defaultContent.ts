import {
  DEFAULT_MINISTRIES,
  DEFAULT_MINISTRY_LAYOUT,
  type MinistryItem,
  type MinistryLayout,
} from "./ministries";

export type { MinistryItem, MinistryLayout };

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

export type AboutPoint = {
  id: string;
  title: string;
  text: string;
};

export type MemoryPhoto = {
  id: string;
  src: string;
  alt: string;
};

export type AlbumPhoto = {
  id: string;
  src: string;
  alt: string;
  caption: string;
};

export type NavLink = {
  id: string;
  href: string;
  label: string;
};

/** Enlaces que se muestran en el menú y en Explorar del pie. */
export const ESSENTIAL_NAV: NavLink[] = [
  { id: "nav-sede", href: "#donde", label: "Sede" },
  { id: "nav-jdj", href: "#jdj", label: "La JDJ" },
  { id: "nav-recuerdos", href: "/recuerdos", label: "Recuerdos" },
  { id: "nav-tienda", href: "/tienda", label: "Tienda" },
  { id: "nav-donar", href: "/donar", label: "Donar" },
  { id: "nav-catequesis", href: "/catequesis", label: "Catequesis" },
];

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

export type SedeCardItem = {
  id: string;
  title: string;
  image: string;
  body: string;
};

export type SedeTopicContent = {
  title: string;
  lead: string;
  heroImageUrl: string;
  items: SedeCardItem[];
};

export type StoreVariant = {
  id: string;
  size: string;
  color: string;
  /** Unidades de esta talla/color. 0 = agotada. */
  stock: number;
};

export type StoreProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  /** Portada: la primera foto del carrusel. */
  imageUrl: string;
  imageUrls: string[];
  variants: StoreVariant[];
  /** En /tienda se ve como ????? hasta que se desactive o llegue revealAt. */
  comingSoon: boolean;
  /** Fecha ISO o YYYY-MM-DD. Vacío = se queda oculto mientras comingSoon. */
  revealAt: string;
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
  variantId: string;
  size: string;
  color: string;
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
  admin: {
    /**
     * Conservado por compatibilidad. El panel ya no lo usa:
     * en producción nunca se suben archivos; en local el interruptor
     * Modo tester / Modo producción vive solo en esa sesión.
     */
    allowMediaUploads: boolean;
  };
  hero: {
    slogan: string;
    tagline: string;
    ctaLabel: string;
    ctaHref: string;
    highlights: HeroHighlight[];
    /** Foto de fondo del hero. Vacío deja el cielo y las colinas. */
    imageUrl: string;
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
    /** Conservado por compatibilidad; la landing ya no muestra el feed. */
    posts: InstagramPostItem[];
  };
  about: {
    eyebrow: string;
    title: string;
    lead: string;
    body: string;
    items: AboutPoint[];
  };
  memories: {
    eyebrow: string;
    title: string;
    lead: string;
    images: MemoryPhoto[];
  };
  destination: {
    eyebrow: string;
    title: string;
    lead: string;
    images: MemoryPhoto[];
  };
  album: {
    eyebrow: string;
    title: string;
    lead: string;
    emptyTitle: string;
    emptyText: string;
    shareEyebrow: string;
    shareTitle: string;
    shareLead: string;
    shareCta: string;
    shareUrl: string;
    images: AlbumPhoto[];
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
  ministries: MinistryItem[];
  ministriesLayout: MinistryLayout;
  commissions: SedeTopicContent;
  volunteers: SedeTopicContent;
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
    /** Si es true, /catequesis no lista documentos y muestra el aviso. */
    comingSoon: boolean;
    comingSoonTitle: string;
    comingSoonText: string;
    ctaLabel: string;
    docs: CatechesisDoc[];
    heroImageUrl: string;
  };
  donate: {
    heroImageUrl: string;
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
  admin: {
    allowMediaUploads: true,
  },
  hero: {
    slogan: "Tengan valor y síganme",
    tagline: "Jornada Diocesana de la Juventud · Arquidiócesis de San Salvador",
    ctaLabel: "Descubrir el encuentro",
    ctaHref: "#donde",
    highlights: [
      { id: "sede", label: "Sede", value: "Jayaque", href: "" },
      {
        id: "parroquia",
        label: "Parroquia",
        value: "San Cristóbal",
        href: "",
      },
      {
        id: "fecha",
        label: "Fecha",
        value: "14 nov 2026",
        href: "",
      },
    ],
    imageUrl: "",
  },
  location: {
    eyebrow: "Sede 2026",
    title: "Este año la JDJ camina hacia Jayaque",
    lead: "Un encuentro de fe, esperanza y comunidad en las montañas de la Arquidiócesis de San Salvador.",
    parishLabel: "Parroquia sede",
    parishName: "Parroquia San Cristóbal",
    placeLine: "Jayaque, El Salvador",
    note: "La cúpula del logo evoca esta iglesia que abre sus puertas para acoger a la juventud Diocesana. Los caminos verdes recuerdan la geografía montañosa del lugar y el itinerario del peregrino.",
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
    mapNote: "",
    directionsLabel: "Abrir en Google Maps",
    wazeLabel: "Abrir en Waze",
  },
  instagram: {
    enabled: true,
    eyebrow: "Instagram",
    title: "Síguenos",
    lead: "Sigue a PJ Arquidiocesana en redes sociales para las novedades de la JDJ",
    handle: "pjarqui_ss",
    posts: [],
  },
  about: {
    eyebrow: "La JDJ",
    title: "¿Qué es la Jornada Diocesana de la Juventud?",
    lead: "",
    body: "La JDJ es el encuentro bienal de adolescentes y jóvenes de las 17 vicarías, grupos parroquiales, movimientos y comunidades eclesiales. Un día de Eucaristía, catequesis, fiesta y envío, para caminar juntos detrás de Cristo. En 2024 nos vimos en Suchitoto; en 2026 el camino sigue hacia Jayaque.",
    items: [],
  },
  memories: {
    eyebrow: "",
    title: "La última vez que nos vimos",
    lead: "La JDJ se celebra cada dos años. Estas imágenes recuerdan el encuentro en Suchitoto; ahora el camino sigue hacia Jayaque.",
    images: [],
  },
  destination: {
    eyebrow: "Jayaque 2026",
    title: "#JayaqueLaLleva",
    lead: "Ahí es donde iremos este 2026. Jayaque abre sus montañas y la Parroquia San Cristóbal sus puertas para acoger a la juventud de la Arquidiócesis.",
    images: [],
  },
  album: {
    eyebrow: "Álbum",
    title: "Recuerdos de Jayaque",
    lead: "Un álbum de fotos del camino hacia la JDJ 2026. Toca una polaroid para verla en grande.",
    emptyTitle: "El álbum se está llenando",
    emptyText:
      "Pronto verás aquí fotos de Jayaque y del camino hacia el encuentro.",
    shareEyebrow: "Álbum compartido",
    shareTitle: "¡Participa agregando tus fotos!",
    shareLead:
      "Súbelas al álbum de Google Photos para que tu recuerdo también forme parte de la JDJ.",
    shareCta: "Abrir álbum compartido",
    shareUrl: "https://photos.app.goo.gl/3Q7aokzJS4FTerCU8",
    images: [],
  },
  meaning: {
    eyebrow: "Identidad",
    title: "Significado del logo",
    lead: "Cada elemento cuenta una parte del mensaje: Eucaristía, Iglesia, camino y unidad Diocesana.",
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
    lead: "Lo esencial para empezar a prepararte y acompañar este camino Diocesano.",
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
        title: "Juventud Arquidiocesana",
        text: "Adolescentes y jóvenes de las 17 vicarías, grupos parroquiales, movimientos y comunidades eclesiales, y todo joven que quiere ser parte de este evento: están totalmente invitados.",
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
    title: "Agenda",
    lead: "Parroquia San Cristóbal · 8:30 a. m. a 6:00 p. m.",
    startDate: "2026-11-14T08:30",
    dateLabel: "14 de noviembre de 2026",
    countdownEyebrow: "Cuenta regresiva",
    countdownTitle: "Faltan",
    countdownLiveText: "¡Estamos viviendo la JDJ 2026!",
    countdownDoneText: "Gracias por caminar con nosotros en la JDJ 2026.",
    items: [
      {
        id: "hora-previa",
        time: "7:30 a. m.",
        title: "Previa",
        text: "Apertura y recibimiento de jóvenes, animación en los puntos de ingreso, e inicio de ventas.",
      },
      {
        id: "hora-maria",
        time: "8:30 a. m.",
        title: "Mi encuentro con María",
        text: "Momento inicial, rezo del Santo Rosario en tarima central previo a Santa Eucaristía.",
      },
      {
        id: "hora-eucaristia",
        time: "9:30 a. m.",
        title: "Santa Eucaristía",
        text: "",
      },
      {
        id: "hora-senor",
        time: "11:30 a. m.",
        title: "Mi encuentro con el Señor",
        text: "Al finalizar la Eucaristía, se expone El Santísimo y se traslada al monumento donde se dará inicio a la adoración Eucarística durante toda la jornada.",
      },
      {
        id: "hora-almuerzo",
        time: "12:00 p. m.",
        title: "Almuerzo",
        text: "",
      },
      {
        id: "hora-encuentro",
        time: "1:00 p. m.",
        title: "Bloque de encuentro",
        text: "Momento central de la JDJ, en el que se habilitarán distintos espacios y actividades para el desarrollo del mensaje de esta edición de la JDJ (Vocafest, sacramento de la reconciliación, conversatorios, conciertos, entre otros).",
      },
      {
        id: "hora-vocacional",
        time: "4:00 p. m.",
        title: "Momento vocacional",
        text: "Conversatorio y momento vocacional central en tarima principal.",
      },
      {
        id: "hora-cierre-adoracion",
        time: "4:30 p. m.",
        title: "Cierre adoración Eucarística",
        text: "Se traslada El Santísimo desde el templo parroquial hacia la tarima principal para un pequeño momento de adoración central y reserva del Santísimo.",
      },
      {
        id: "hora-concierto",
        time: "5:00 p. m.",
        title: "Concierto final",
        text: "Momento final de nuestra Jornada Diocesana de la Juventud con un gran concierto de cierre.",
      },
    ],
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
    title: "#TodosPorTodos",
    lead: "",
    credit: "Arquidiócesis de San Salvador · El Salvador",
    logos: [],
  },
  ministries: DEFAULT_MINISTRIES.map((item) => ({ ...item })),
  ministriesLayout: DEFAULT_MINISTRY_LAYOUT,
  commissions: {
    title: "Comisiones",
    lead: "",
    heroImageUrl: "",
    items: [
      {
        id: "logistica",
        title: "Comisión de logística y operaciones",
        image: "",
        body: "Responsable de la planificación, coordinación y ejecución operativa de toda la Jornada, garantizando el correcto funcionamiento de los espacios, recursos y servicios necesarios para el desarrollo seguro y ordenado del evento.",
      },
      {
        id: "pastoral",
        title: "Comisión Pastoral y Litúrgica",
        image: "",
        body: "Esta comisión vela por el corazón espiritual y pastoral de la JDJ.",
      },
      {
        id: "animacion",
        title: "Comisión de animación, cultura y experiencia juvenil",
        image: "",
        body: "Esta comisión busca que los jóvenes vivan una experiencia cercana, dinámica y memorable durante toda la Jornada.",
      },
      {
        id: "comunicacion",
        title: "Comisión de comunicación y difusión",
        image: "",
        body: "Esta comisión es la encargada de proyectar la imagen y el mensaje oficial de la JDJ antes, durante y después del evento.",
      },
    ],
  },
  volunteers: {
    title: "Voluntarios",
    lead: "La JDJ se construye en equipo. Pronto publicaremos cómo sumarte en las distintas áreas del encuentro.",
    heroImageUrl: "",
    items: [],
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
    nav: ESSENTIAL_NAV.filter((item) => item.id !== "nav-jdj").map((item) =>
      item.id === "nav-sede"
        ? { ...item, href: "#inicio", label: "Inicio" }
        : item,
    ),
  },
  catechesis: {
    eyebrow: "Preparación",
    title: "Catequesis para el encuentro",
    lead: "Aquí encontrarás los documentos para prepararte con tu parroquia, grupo o vicaría rumbo a la JDJ 2026.",
    emptyTitle: "Los materiales se publicarán pronto",
    emptyText:
      "Estamos reuniendo las catequesis de preparación. Vuelve a esta página para descargar guías, fichas y recursos del camino hacia Jayaque.",
    comingSoon: true,
    comingSoonTitle: "Catequesis muy pronto...",
    comingSoonText:
      "El material de preparación se publicará más adelante. Sigue caminando con tu grupo y estate atento: las catequesis llegarán cuando toque.",
    ctaLabel: "Ver documentos",
    docs: [],
    heroImageUrl: "",
  },
  donate: {
    heroImageUrl: "",
  },
  footer: {
    logoUrl: "/images/logo-pja.webp",
    org: "Pastoral Juvenil · Arquidiócesis de San Salvador",
    exploreLabel: "Explorar",
    socialLabel: "Redes oficiales",
    bottomLeft: "JDJ Jayaque 2026",
    bottomRight: "Arquidiócesis de San Salvador, El Salvador",
    nav: [...ESSENTIAL_NAV],
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
        href: "https://www.facebook.com/pjarquiss",
      },
      {
        id: "youtube",
        name: "YouTube",
        handle: "",
        href: "",
      },
      {
        id: "tiktok",
        name: "TikTok",
        handle: "",
        href: "",
      },
    ],
  },
};
