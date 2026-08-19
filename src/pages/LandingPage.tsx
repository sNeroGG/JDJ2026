import { Catechesis } from "../components/Catechesis";
import { Countdown } from "../components/Countdown";
import { EventInfo } from "../components/EventInfo";
import { Faq } from "../components/Faq";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { Location } from "../components/Location";
import { Meaning } from "../components/Meaning";
import { Navbar } from "../components/Navbar";
import { Partners } from "../components/Partners";
import { Registration } from "../components/Registration";
import { Schedule } from "../components/Schedule";
import { Vicariates } from "../components/Vicariates";
import { useContent } from "../context/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { useStructuredData } from "../hooks/useStructuredData";

export function LandingPage() {
  const { content } = useContent();

  useSeo({
    title: content.site.pageTitle,
    description: content.site.metaDescription,
    path: "/",
    siteUrl: content.site.url,
    image: content.site.ogImage,
  });
  useStructuredData(content);

  return (
    <div className="app">
      <Navbar />
      <Hero />
      <Countdown />
      <main>
        <Location />
        <Meaning />
        <Vicariates />
        <EventInfo />
        <Schedule />
        <Registration />
        <Catechesis />
        <Faq />
        <Partners />
      </main>
      <Footer />
    </div>
  );
}
