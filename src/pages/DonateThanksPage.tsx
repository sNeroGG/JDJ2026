import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useContent } from "../context/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { isUuid } from "../utils/ids";
import "./DonatePage.css";

export function DonateThanksPage() {
  const { content } = useContent();
  const { site } = content;
  const [params] = useSearchParams();
  const rawId = params.get("id") || "";
  const id = isUuid(rawId) ? rawId : "";

  useSeo({
    title: `Gracias · ${site.name} ${site.year}`,
    description: "Recibimos tu intento de donación. La confirmación llega cuando Wompi notifica el pago.",
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
              Si completaste el pago en Wompi, el movimiento se registra cuando
              Wompi confirma la transacción. Esta pantalla no es el comprobante
              final.
            </p>
            {id ? (
              <p className="donate-thanks__ref">Referencia: {id}</p>
            ) : null}
            <Link className="donate-form__submit" to="/donar">
              Hacer otra donación
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
