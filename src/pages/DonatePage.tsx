import { useEffect, useState, type FormEvent } from "react";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import {
  DONATION_MAX,
  DONATION_MIN,
  DONATION_PRESETS,
  isDonationPreset,
  normalizeDui,
  parseDonationAmount,
} from "../utils/donations";
import { formatUsd } from "../utils/store";
import "./DonatePage.css";

const EMPTY = {
  fullName: "",
  dui: "",
  email: "",
  phone: "",
  parish: "",
  amount: "10",
};

export function DonatePage() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { site } = content;
  const [form, setForm] = useState(EMPTY);
  const [customAmount, setCustomAmount] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  useSeo({
    title: `Donar · ${site.name} ${site.year}`,
    description:
      "Aporta entre $5 y $25 a la JDJ Jayaque 2026. Completa tus datos y paga con Wompi.",
    path: "/donar",
    siteUrl: site.url,
    image: site.ogImage,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    const amount = parseDonationAmount(form.amount);
    if (amount == null || amount < DONATION_MIN || amount > DONATION_MAX) {
      setNotice(`El monto debe estar entre ${formatUsd(DONATION_MIN)} y ${formatUsd(DONATION_MAX)}.`);
      return;
    }
    setSending(true);
    try {
      const remote = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          dui: form.dui,
          email: form.email,
          phone: form.phone,
          parish: form.parish,
          amount,
        }),
      });
      const payload = (await remote.json().catch(() => null)) as {
        error?: string;
        redirectUrl?: string;
      } | null;
      if (!remote.ok || !payload?.redirectUrl) {
        setNotice(payload?.error || "No se pudo iniciar el pago.");
        return;
      }
      window.location.assign(payload.redirectUrl);
    } catch {
      setNotice("No se pudo conectar con el servidor de donaciones.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="donate-page">
      <Navbar />
      <main>
        <section className="section donate-page__section" ref={ref}>
          <div className="section__inner donate-page__layout">
            <div className="donate-page__intro reveal">
              <p className="section__eyebrow">Aporta al encuentro</p>
              <h1 className="section__title">Donar a la JDJ 2026</h1>
              <p className="section__lead">
                Recibimos aportes de {formatUsd(DONATION_MIN)} a{" "}
                {formatUsd(DONATION_MAX)}. Primero registramos quién dona;
                después Wompi cobra el monto fijo. No aceptamos montos fuera de
                ese rango ni pagos anónimos.
              </p>
            </div>

            <form className="donate-form reveal" onSubmit={(e) => void onSubmit(e)}>
              <p className="donate-form__eyebrow">Tus datos</p>
              <h2>Formulario de donación</h2>
              <label>
                Nombre completo
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                DUI
                <input
                  value={form.dui}
                  onChange={(e) =>
                    setForm({ ...form, dui: normalizeDui(e.target.value) })
                  }
                  inputMode="numeric"
                  placeholder="00000000-0"
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                Correo
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Teléfono
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  autoComplete="tel"
                  required
                />
              </label>
              <label>
                Parroquia / Vicaría / Movimiento
                <input
                  value={form.parish}
                  onChange={(e) => setForm({ ...form, parish: e.target.value })}
                  required
                />
              </label>
              <fieldset className="donate-form__amount">
                <legend>Monto</legend>
                <div className="donate-form__presets">
                  {DONATION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={
                        !customAmount && Number(form.amount) === preset
                          ? "is-active"
                          : ""
                      }
                      onClick={() => {
                        setCustomAmount(false);
                        setForm({ ...form, amount: String(preset) });
                      }}
                    >
                      {formatUsd(preset)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={customAmount ? "is-active" : ""}
                    onClick={() => {
                      setCustomAmount(true);
                      const current = parseDonationAmount(form.amount);
                      if (current != null && isDonationPreset(current)) {
                        setForm({ ...form, amount: "" });
                      }
                    }}
                  >
                    Otro monto
                  </button>
                </div>
                {customAmount ? (
                  <label>
                    Escribe un monto entre {formatUsd(DONATION_MIN)} y{" "}
                    {formatUsd(DONATION_MAX)}
                    <input
                      type="number"
                      min={DONATION_MIN}
                      max={DONATION_MAX}
                      step="0.01"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
                      }
                      placeholder={`${DONATION_MIN} – ${DONATION_MAX}`}
                      required
                    />
                  </label>
                ) : null}
              </fieldset>
              <p className="donate-form__privacy">
                Usamos estos datos solo para identificar el origen de cada
                aporte y llevar el registro de la Pastoral Juvenil. No los
                vendemos ni los usamos para fines ajenos a la JDJ.
              </p>
              {notice ? <p className="donate-form__notice">{notice}</p> : null}
              <button type="submit" className="donate-form__submit" disabled={sending}>
                {sending ? "Abriendo Wompi…" : "Continuar a Wompi"}
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
