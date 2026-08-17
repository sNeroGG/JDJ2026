import { useEffect } from "react";
import { EventInfo } from "../components/EventInfo";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { Location } from "../components/Location";
import { Meaning } from "../components/Meaning";
import { Partners } from "../components/Partners";
import { useContent } from "../context/ContentContext";

export function LandingPage() {
  const { content } = useContent();

  useEffect(() => {
    document.title = content.site.pageTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", content.site.metaDescription);
    }
  }, [content.site.pageTitle, content.site.metaDescription]);

  return (
    <div className="app">
      <Hero />
      <main>
        <Location />
        <Meaning />
        <EventInfo />
        <Partners />
      </main>
      <Footer />
    </div>
  );
}
