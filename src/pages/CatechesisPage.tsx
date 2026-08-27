import { useEffect } from "react";
import { DocumentList } from "../components/DocumentList";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { PageHero } from "../components/PageHero";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import "../components/Catechesis.css";
import "./CatechesisPage.css";

export function CatechesisPage() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { catechesis, site } = content;
  const heroImage = catechesis.heroImageUrl;

  useSeo({
    title: `${catechesis.title} · ${site.name} ${site.year}`,
    description: catechesis.lead || site.metaDescription,
    path: "/catequesis",
    siteUrl: site.url,
    image: site.ogImage,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app">
      <Navbar />
      <PageHero
        src={heroImage}
        alt={`Catequesis de la ${site.name} ${site.year}`}
      />
      <main>
        <section
          className={`section catechesis catechesis-page${heroImage ? " has-hero" : ""}`}
          ref={ref}
        >
          <div className="section__inner catechesis-page__layout">
            <div className="catechesis__intro reveal">
              <p className="section__eyebrow">{catechesis.eyebrow}</p>
              <h1 className="section__title">{catechesis.title}</h1>
              <p className="section__lead">{catechesis.lead}</p>
            </div>
            <div className="catechesis-page__docs reveal reveal-delay-1">
              <DocumentList
                docs={catechesis.docs}
                emptyTitle={catechesis.emptyTitle}
                emptyText={catechesis.emptyText}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
