import { useEffect } from "react";
import type { SiteContent } from "../data/defaultContent";
import { parseEventDate } from "../utils/dates";

const SCRIPT_ID = "jdj-structured-data";

function absolute(value: string, base: string) {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

function buildGraph(content: SiteContent, base: string) {
  const { site, location, footer, faq, schedule } = content;
  const eventName = `${site.name} ${site.year}`.trim();
  const image = absolute(site.ogImage, base);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: eventName,
      url: `${base}/`,
      inLanguage: "es-SV",
      description: site.metaDescription,
    },
  ];

  const start = parseEventDate(schedule.startDate);
  if (start) {
    graph.push({
      "@type": "Event",
      "@id": `${base}/#event`,
      name: eventName,
      description: site.metaDescription,
      startDate: start.toISOString(),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      url: `${base}/`,
      ...(image ? { image: [image] } : {}),
      location: {
        "@type": "Place",
        name: location.parishName,
        address: location.placeLine,
      },
      organizer: {
        "@type": "Organization",
        name: footer.org,
        url: `${base}/`,
      },
    });
  }

  if (faq.items.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${base}/#faq`,
      mainEntity: faq.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/** Datos estructurados para que Google entienda el evento y las preguntas frecuentes. */
export function useStructuredData(content: SiteContent) {
  useEffect(() => {
    const base = (content.site.url || window.location.origin).replace(/\/+$/, "");
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(buildGraph(content, base));

    return () => {
      script?.remove();
    };
  }, [content]);
}
