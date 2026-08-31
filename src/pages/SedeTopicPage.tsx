import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Ministerios } from "../components/Ministerios";
import { Navbar } from "../components/Navbar";
import { PageHero } from "../components/PageHero";
import { Schedule } from "../components/Schedule";
import { SedeCards } from "../components/SedeCards";
import { SiteLink } from "../components/SiteLink";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import { sedeTopicByPath } from "../utils/sedeTopics";
import "./SedeTopicPage.css";

export function SedeTopicPage() {
  const ref = useReveal<HTMLElement>();
  const { pathname } = useLocation();
  const { content } = useContent();
  const { site, schedule, commissions, volunteers } = content;
  const topic = sedeTopicByPath(pathname);
  const isAgenda = topic?.path === "/agenda";
  const isComisiones = topic?.path === "/comisiones";
  const isMinisterios = topic?.path === "/ministerios";
  const isVoluntarios = topic?.path === "/voluntarios";
  const cards = isComisiones
    ? commissions
    : isVoluntarios
      ? volunteers
      : null;

  useSeo({
    title: topic
      ? `${topic.title} · ${site.name} ${site.year}`
      : `${site.name} ${site.year}`,
    description: isAgenda
      ? schedule.lead || topic?.description || site.metaDescription
      : cards
        ? cards.lead || topic?.description || site.metaDescription
        : isMinisterios
          ? "Los ministerios de la JDJ Jayaque 2026: Corazón Inquieto, Angelus, Proyecto Católico y Ministerio Pro Deo."
          : topic?.description || site.metaDescription,
    path: pathname,
    siteUrl: site.url,
    image: site.ogImage,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!topic) return <Navigate to="/" replace />;

  if (cards) {
    return (
      <div className="app">
        <Navbar />
        <PageHero
          src={cards.heroImageUrl}
          alt={`${cards.title} de la ${site.name} ${site.year}`}
        />
        <main>
          <SedeCards
            title={cards.title}
            lead={cards.lead}
            items={cards.items}
            hasHero={Boolean(cards.heroImageUrl)}
            emptyText={`Este apartado se irá completando. Pronto encontrarás aquí la información de ${topic.title.toLowerCase()}.`}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (isMinisterios) {
    return (
      <div className="app">
        <Navbar />
        <main>
          <Ministerios />
        </main>
        <Footer />
      </div>
    );
  }

  if (isAgenda) {
    return (
      <div className="app">
        <Navbar />
        <main>
          <Schedule page />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main>
        <section className="section sede-topic" ref={ref}>
          <div className="section__inner sede-topic__inner reveal">
            <h1 className="section__title">{topic.title}</h1>
            <p className="section__lead">
              Este apartado se irá completando. Pronto encontrarás aquí la
              información de {topic.title.toLowerCase()}.
            </p>
            <SiteLink className="sede-topic__back" href="#donde">
              Volver a Sede
            </SiteLink>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
