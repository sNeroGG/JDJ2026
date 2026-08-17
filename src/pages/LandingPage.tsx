import { EventInfo } from "../components/EventInfo";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { Location } from "../components/Location";
import { Meaning } from "../components/Meaning";
import { Partners } from "../components/Partners";

export function LandingPage() {
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
