export const ADMIN_SECTIONS = [
  "site",
  "event",
  "location",
  "album",
  "catechesis",
  "store",
  "orders",
  "donations",
  "page",
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

export function isAdminSection(value: string | null): value is AdminSection {
  return ADMIN_SECTIONS.includes(value as AdminSection);
}

export const ADMIN_GROUPS: {
  id: string;
  label: string;
  items: AdminSection[];
}[] = [
  {
    id: "sitio",
    label: "Sitio",
    items: ["site", "location", "event", "album", "page"],
  },
  { id: "preparacion", label: "Preparación", items: ["catechesis"] },
  { id: "tienda", label: "Tienda", items: ["store", "orders"] },
  { id: "donar", label: "Donar", items: ["donations"] },
];

export type AdminPart = {
  id: string;
  section: AdminSection;
  label: string;
  keywords: string;
};

export const ADMIN_PARTS: AdminPart[] = [
  {
    id: "fotos",
    section: "site",
    label: "Modo del panel",
    keywords: "fotos imagenes produccion tester boolean subir archivos modo",
  },
  {
    id: "logos",
    section: "site",
    label: "Logos",
    keywords: "logo portada footer emblema",
  },
  {
    id: "portada",
    section: "site",
    label: "Textos de portada",
    keywords: "nombre año slogan lema hero cta",
  },
  {
    id: "hero",
    section: "site",
    label: "Imagen hero",
    keywords: "fondo foto portada inicio",
  },
  {
    id: "seo",
    section: "site",
    label: "SEO y compartir",
    keywords: "seo titulo descripcion dominio og",
  },
  {
    id: "fecha",
    section: "event",
    label: "Fecha",
    keywords: "cuenta regresiva noviembre agenda",
  },
  {
    id: "agenda",
    section: "event",
    label: "Agenda del día",
    keywords: "horario actividades programa /agenda",
  },
  {
    id: "evento",
    section: "event",
    label: "Tarjetas del evento",
    keywords: "informacion lema quien cuando",
  },
  {
    id: "inscripcion",
    section: "event",
    label: "Inscripción",
    keywords: "registro formulario",
  },
  {
    id: "sede",
    section: "location",
    label: "Sede",
    keywords: "jayaque parroquia san cristobal mapa",
  },
  {
    id: "ministerios",
    section: "location",
    label: "Ministerios",
    keywords: "ministerios logos fotos modo corazon inquieto angelus proyecto catolico pro deo",
  },
  {
    id: "comisiones",
    section: "location",
    label: "Comisiones",
    keywords: "comisiones logistica pastoral liturgica animacion comunicacion foto header",
  },
  {
    id: "voluntarios",
    section: "location",
    label: "Voluntarios",
    keywords: "voluntarios voluntariado equipo foto header",
  },
  {
    id: "suchitoto",
    section: "location",
    label: "Suchitoto 2024",
    keywords: "recuerdos fotos encuentro anterior",
  },
  {
    id: "jayaque",
    section: "location",
    label: "Jayaque 2026",
    keywords: "hashtag jayaquelalleva fotos lugar",
  },
  {
    id: "instagram",
    section: "location",
    label: "Redes",
    keywords: "redes seguir instagram facebook youtube tiktok pjarqui",
  },
  {
    id: "mapa",
    section: "location",
    label: "Mapa",
    keywords: "google maps waze latitud longitud",
  },
  {
    id: "album",
    section: "album",
    label: "Álbum de recuerdos",
    keywords: "polaroid fotos jayaque google photos compartido",
  },
  {
    id: "catequesis-hero",
    section: "catechesis",
    label: "Imagen hero de catequesis",
    keywords: "foto portada catequesis",
  },
  {
    id: "documentos",
    section: "catechesis",
    label: "Documentos",
    keywords: "pdf guias materiales",
  },
  {
    id: "tienda-logo",
    section: "store",
    label: "Logo de la tienda",
    keywords: "tienda logo camisas",
  },
  {
    id: "tienda-textos",
    section: "store",
    label: "Textos y compra",
    keywords: "whatsapp precio pago",
  },
  {
    id: "productos",
    section: "store",
    label: "Productos",
    keywords: "camisas stock tallas",
  },
  {
    id: "pedidos",
    section: "orders",
    label: "Resumen de pedidos",
    keywords: "ordenes tienda whatsapp tallas stock resumen",
  },
  {
    id: "registro",
    section: "orders",
    label: "Registro de pedidos",
    keywords: "lista pedidos estado detalle ordenes registro",
  },
  {
    id: "donar-hero",
    section: "donations",
    label: "Imagen hero de donar",
    keywords: "donar foto",
  },
  {
    id: "donaciones",
    section: "donations",
    label: "Donaciones",
    keywords: "transferencia wompi aportes",
  },
  {
    id: "about",
    section: "page",
    label: "Qué es la JDJ",
    keywords: "jornada juventud texto",
  },
  {
    id: "faq",
    section: "page",
    label: "Preguntas frecuentes",
    keywords: "faq dudas",
  },
  {
    id: "logo-significado",
    section: "page",
    label: "Significado del logo",
    keywords: "identidad elementos",
  },
  {
    id: "partners",
    section: "page",
    label: "#TodosPorTodos",
    keywords: "arquidiocesis auspiciadores logos institucionales todosportodos",
  },
  {
    id: "pie",
    section: "page",
    label: "Pie y vicarías",
    keywords: "footer explorar pie",
  },
];

export function searchAdminParts(query: string) {
  const q = query.trim().toLocaleLowerCase("es-SV");
  if (!q) return [];
  return ADMIN_PARTS.filter((part) =>
    `${part.label} ${part.keywords} ${part.section}`
      .toLocaleLowerCase("es-SV")
      .includes(q),
  );
}
