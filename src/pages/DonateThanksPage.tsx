import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useContent } from "../context/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { whatsappDonationFollowupUrl } from "../utils/donations";
import { isUuid } from "../utils/ids";
import "./DonatePage.css";

export function DonateThanksPage() {
  const { content } = useContent();
  const { site, store } = content;
  const [params] = useSearchParams();
  const rawId = params.get("id") || "";
  const id = isUuid(rawId) ? rawId : "";
  const whatsappUrl = id ? whatsappDonationFollowupUrl(store.whatsapp, id) : "";

  useSeo({
    title: `Gracias · ${site.name} ${site.year}`,
    description:
      "Recibimos tu donación. Completa el pago por transferencia bancaria mediante WhatsApp.",
    path: "/donar/gracias",
    siteUrl: site.url,
    image: site.ogImage,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="donate-page">
      <Navbar />
      <main>
        <section className="section donate-page__section">
          <div className="section__inner donate-thanks">
            <p className="section__eyebrow">Donación</p>
            <h1 className="section__title">Gracias por tu aporte</h1>
            <p className="section__lead">
              Registramos tu donación como pendiente. Completa el pago por
              transferencia bancaria: en WhatsApp te compartimos los datos de la
              cuenta. Cuando llegue el comprobante, la marcamos como pagada.
            </p>
            {id ? (
              <p className="donate-thanks__ref">Referencia: {id}</p>
            ) : null}
            {whatsappUrl ? (
              <a
                className="donate-form__submit"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Continuar por WhatsApp
              </a>
            ) : null}
            <Link className="donate-thanks__again" to="/donar">
              Hacer otra donación
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
