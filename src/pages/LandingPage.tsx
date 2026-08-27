import { useEffect } from "react";
import { AboutJdj } from "../components/AboutJdj";
import { Catechesis } from "../components/Catechesis";
import { DonateInvite } from "../components/DonateInvite";
import { EventInfo } from "../components/EventInfo";
import { Faq } from "../components/Faq";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { InstagramFeed } from "../components/InstagramFeed";
import { Location } from "../components/Location";
import { Meaning } from "../components/Meaning";
import { Navbar } from "../components/Navbar";
import { Partners } from "../components/Partners";
import { Registration } from "../components/Registration";
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

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const isReload = nav?.type === "reload";

    if (isReload && window.location.hash) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }

    if (isReload || !window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="app">
      <Navbar />
      <Hero />
      <main>
        <Location />
        <AboutJdj />
        <InstagramFeed />
        <Meaning />
        <Vicariates />
        <EventInfo />
        <Registration />
        <Catechesis />
        <DonateInvite />
        <Faq />
        <Partners />
      </main>
      <Footer />
    </div>
  );
}
