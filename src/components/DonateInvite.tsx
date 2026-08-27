import { SiteLink } from "./SiteLink";
import { useReveal } from "../hooks/useReveal";
import { DONATION_MAX, DONATION_MIN } from "../utils/donations";
import { formatUsd } from "../utils/store";
import "../pages/DonatePage.css";

export function DonateInvite() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section donate-invite" id="donar" ref={ref}>
      <div className="section__inner donate-invite__inner reveal">
        <p className="section__eyebrow">Aporta</p>
        <h2 className="section__title">Sostén el camino hacia Jayaque</h2>
        <p className="section__lead">
          Con tu aporte nos ayudas a cubrir los gastos del evento. Puedes donar
          entre {formatUsd(DONATION_MIN)} y {formatUsd(DONATION_MAX)} por
          transferencia bancaria; te pedimos tus datos para registrar cada
          movimiento y te enviamos los datos de la cuenta por WhatsApp.
        </p>
        <SiteLink className="donate-form__submit" href="/donar">
          Donar ahora
        </SiteLink>
      </div>
    </section>
  );
}
