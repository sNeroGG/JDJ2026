import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useContent } from "../context/ContentContext";
import { useSeo } from "../hooks/useSeo";
import type { StoreOrder } from "../data/defaultContent";
import { formatUsd, normalizeWhatsapp, whatsappOrderUrl } from "../utils/store";
import {
  clearStoreCart,
  loadStoreCart,
  saveStoreCart,
  type StoreCartItem,
} from "../utils/storeCart";
import "./StorePage.css";

export function StoreCheckoutPage() {
  const { content } = useContent();
  const { store, site } = content;
  const [cart, setCart] = useState<StoreCartItem[]>(loadStoreCart);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [parish, setParish] = useState("");
  const [vicariate, setVicariate] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [department, setDepartment] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [completedOrder, setCompletedOrder] = useState<StoreOrder | null>(null);
  const [completedWaUrl, setCompletedWaUrl] = useState("");
  const [waSent, setWaSent] = useState(false);

  useSeo({
    title: `Resumen de Pedido · ${store.title} · ${site.name}`,
    description: "Revisa tu pedido de la Tienda JDJ 2026, completa tus datos y confirma por WhatsApp.",
    path: "/tienda/pedido",
    siteUrl: site.url,
    image: site.ogImage,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StoreCartItem[]>;
      if (customEvent.detail && !completedOrder) {
        setCart(customEvent.detail);
      }
    };
    window.addEventListener("jdj-cart-update", handleCartUpdate);
    return () => window.removeEventListener("jdj-cart-update", handleCartUpdate);
  }, [completedOrder]);

  function updateQty(id: string, delta: number) {
    const next = cart
      .map((item) => {
        if (item.id !== id) return item;
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      })
      .filter((item): item is StoreCartItem => item !== null);
    setCart(next);
    saveStoreCart(next);
  }

  function setDirectQty(id: string, qty: number) {
    const next = cart
      .map((item) => {
        if (item.id !== id) return item;
        return qty > 0 ? { ...item, quantity: qty } : null;
      })
      .filter((item): item is StoreCartItem => item !== null);
    setCart(next);
    saveStoreCart(next);
  }

  function removeItem(id: string) {
    const next = cart.filter((item) => item.id !== id);
    setCart(next);
    saveStoreCart(next);
  }

  const grandTotalQty = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const grandTotalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.productPrice, 0),
    [cart],
  );

  const whatsappReady = Boolean(normalizeWhatsapp(store.whatsapp));

  async function submitOrder(e: FormEvent) {
    e.preventDefault();
    if (!cart.length || grandTotalQty <= 0) {
      setNotice("Tu carrito está vacío. Agrega camisas antes de continuar.");
      return;
    }
    if (!parish.trim()) {
      setNotice("Escribe tu Parroquia, Movimiento o Asociación.");
      return;
    }

    setSending(true);
    setNotice("");

    try {
      const payload = {
        name,
        email,
        phone,
        parish,
        vicariate,
        municipality,
        department,
        note,
        items: cart.map((item) => ({
          productId: item.productId,
          productTitle: item.productTitle,
          variantId: item.variantId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          productPrice: item.productPrice,
        })),
      };

      const remote = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = (await remote.json().catch(() => null)) as {
        error?: string;
        order?: StoreOrder;
        whatsappUrl?: string;
      } | null;

      if (!remote.ok || !resData?.order) {
        setNotice(resData?.error || "No se pudo registrar el pedido.");
        setSending(false);
        return;
      }

      const order = resData.order;
      const waUrl = resData.whatsappUrl || whatsappOrderUrl(store.whatsapp, order);

      clearStoreCart();
      setCart([]);
      setCompletedOrder(order);
      setCompletedWaUrl(waUrl);

      // Auto scroll to top for step 3
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setNotice("Fallo de conexión al procesar el pedido.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="store-page-wrap">
      <Navbar />
      <main className="store-page store-checkout-page">
        <div className="section__inner store-checkout__container">
          <div className="store-checkout__top">
            <Link to="/tienda" className="store-checkout__back">
              ← Volver al catálogo de la tienda
            </Link>
            <h1 className="store-checkout__title">
              {completedOrder ? "Paso 3: Confirmación por WhatsApp" : "Resumen de tu Pedido"}
            </h1>
            <p className="store-checkout__subtitle">
              {completedOrder
                ? waSent
                  ? "¡Muchas gracias! Tu solicitud ha sido enviada por WhatsApp."
                  : "Por favor presiona el botón para enviar los detalles de tu pedido por WhatsApp."
                : "Revisa las camisas y tallas seleccionadas, ingresa tus datos de parroquia o grupo y confirma tu solicitud."}
            </p>
            <div className="store-checkout__steps">
              <span className={`step ${!completedOrder ? "is-active" : "is-done"}`}>1. Productos</span>
              <span className="step-arrow">→</span>
              <span className={`step ${!completedOrder ? "is-active" : "is-done"}`}>2. Parroquia / Datos</span>
              <span className="step-arrow">→</span>
              <span className={`step ${completedOrder ? "is-active" : ""}`}>3. Confirmación por WhatsApp</span>
            </div>
          </div>

          {completedOrder ? (
            <div className="store-checkout__completed-box">
              <div className="store-completed__card">
                {waSent ? (
                  <div className="store-completed__header">
                    <div className="store-completed__badge">
                      <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h2>¡Agradecemos tu pedido! 🎉</h2>
                    <p className="store-completed__code">
                      Código de pedido: <strong className="store-completed__code-tag">{completedOrder.id}</strong>
                    </p>
                    <div className="store-completed__notice">
                      <p>
                        📌 <strong>Información Importante:</strong> El seguimiento de tu pedido estará siendo enviado a tu WhatsApp. Recibirás allí las instrucciones para realizar la transferencia bancaria.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="store-completed__header">
                    <div className="store-completed__ticket-icon">
                      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h2 className="store-completed__title-resumen">Resumen de pedido:</h2>
                    <p className="store-completed__code">
                      Código de pedido: <strong className="store-completed__code-tag">{completedOrder.id}</strong>
                    </p>
                  </div>
                )}

                <div className="store-completed__summary">
                  {/* Customer Info Grid */}
                  <div className="store-completed__info-grid">
                    <div className="store-completed__info-tile">
                      <span className="info-icon">👤</span>
                      <div>
                        <span className="info-label">Cliente</span>
                        <strong className="info-value">{completedOrder.name}</strong>
                      </div>
                    </div>

                    <div className="store-completed__info-tile">
                      <span className="info-icon">📱</span>
                      <div>
                        <span className="info-label">Teléfono / WhatsApp</span>
                        <strong className="info-value">{completedOrder.phone}</strong>
                      </div>
                    </div>

                    <div className="store-completed__info-tile">
                      <span className="info-icon">✉️</span>
                      <div>
                        <span className="info-label">Correo</span>
                        <strong className="info-value">{completedOrder.email}</strong>
                      </div>
                    </div>

                    <div className="store-completed__info-tile">
                      <span className="info-icon">⛪</span>
                      <div>
                        <span className="info-label">Parroquia, Movimiento o Asociación</span>
                        <strong className="info-value">{completedOrder.parish || "General"}</strong>
                      </div>
                    </div>

                    {completedOrder.vicariate ? (
                      <div className="store-completed__info-tile">
                        <span className="info-icon">📍</span>
                        <div>
                          <span className="info-label">Vicaría</span>
                          <strong className="info-value">{completedOrder.vicariate}</strong>
                        </div>
                      </div>
                    ) : null}

                    {completedOrder.municipality ? (
                      <div className="store-completed__info-tile">
                        <span className="info-icon">🏙️</span>
                        <div>
                          <span className="info-label">Municipio</span>
                          <strong className="info-value">{completedOrder.municipality}</strong>
                        </div>
                      </div>
                    ) : null}

                    {completedOrder.department ? (
                      <div className="store-completed__info-tile">
                        <span className="info-icon">🗺️</span>
                        <div>
                          <span className="info-label">Departamento</span>
                          <strong className="info-value">{completedOrder.department}</strong>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Items Table */}
                  <div className="store-completed__table-card">
                    <h3 className="store-completed__section-title">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Detalle del Pedido
                    </h3>
                    <div className="store-completed__table-scroll">
                      <table className="store-completed__table-custom">
                        <thead>
                          <tr>
                            <th className="col-product">Producto</th>
                            <th className="col-center">Talla</th>
                            <th className="col-center">Color</th>
                            <th className="col-center">Cantidad</th>
                            <th className="col-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {completedOrder.items && completedOrder.items.length > 0 ? (
                            completedOrder.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="col-product">
                                  <strong className="table-product-title">{item.productTitle}</strong>
                                </td>
                                <td className="col-center">
                                  <span className="table-badge-talla">{item.size || "Única"}</span>
                                </td>
                                <td className="col-center">
                                  {item.color ? <span className="table-badge-color">{item.color}</span> : <span className="table-text-muted">-</span>}
                                </td>
                                <td className="col-center">
                                  <span className="table-badge-qty">x{item.quantity}</span>
                                </td>
                                <td className="col-right table-subtotal">
                                  {formatUsd(item.total)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="col-product">
                                <strong className="table-product-title">{completedOrder.productTitle}</strong>
                              </td>
                              <td className="col-center">
                                <span className="table-badge-talla">{completedOrder.size || "Única"}</span>
                              </td>
                              <td className="col-center">
                                {completedOrder.color ? <span className="table-badge-color">{completedOrder.color}</span> : <span className="table-text-muted">-</span>}
                              </td>
                              <td className="col-center">
                                <span className="table-badge-qty">x{completedOrder.quantity}</span>
                              </td>
                              <td className="col-right table-subtotal">
                                {formatUsd(completedOrder.total)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Summary */}
                    <div className="store-completed__grand-box">
                      <div className="summary-line">
                        <span>Total de prendas:</span>
                        <strong>{completedOrder.quantity} unidades</strong>
                      </div>
                      <div className="summary-line">
                        <span>Costo de envío:</span>
                        <span className="shipping-badge">A coordinar en WhatsApp</span>
                      </div>
                      <div className="summary-line grand-total-line">
                        <span>Total a pagar:</span>
                        <span className="grand-total-amount">{formatUsd(completedOrder.total)}</span>
                      </div>
                    </div>
                  </div>

                  {completedOrder.note ? (
                    <div className="store-completed__note">
                      <strong>📝 Indicaciones:</strong> {completedOrder.note}
                    </div>
                  ) : null}
                </div>

                <div className="store-completed__actions-center">
                  {completedWaUrl ? (
                    <a
                      href={completedWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setWaSent(true)}
                      className="btn-whatsapp-centered"
                    >
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                        <path d="M12.012 2c-5.508 0-9.987 4.479-9.987 9.987 0 1.763.459 3.483 1.332 5.004L2 22l5.127-1.341a9.96 9.96 0 004.885 1.28c5.508 0 9.987-4.479 9.987-9.987 0-5.508-4.479-9.987-9.987-9.987zm.006 17.514a8.27 8.27 0 01-4.218-1.155l-.302-.18-3.04.796.81-2.964-.197-.313a8.27 8.27 0 01-1.272-4.437c0-4.564 3.714-8.278 8.278-8.278 4.564 0 8.278 3.714 8.278 8.278 0 4.564-3.714 8.278-8.337 8.278z" />
                      </svg>
                      <span>
                        {waSent ? "Volver a enviar por WhatsApp" : "Enviar pedido por WhatsApp"}
                      </span>
                    </a>
                  ) : null}
                  <p className="store-completed__trust-hint">
                    🔒 Tu pedido queda registrado. El pago es por transferencia tras enviar tu pedido por WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="store-checkout__empty reveal">
              <div className="store-checkout__empty-icon">🛒</div>
              <h2>Tu pedido está vacío</h2>
              <p>Aún no has agregado camisas o productos de la tienda JDJ 2026.</p>
              <Link to="/tienda" className="btn btn--primary" style={{ marginTop: "1rem" }}>
                Ver camisas y recuerdos
              </Link>
            </div>
          ) : (
            <div className="store-checkout__grid">
              <div className="store-checkout__items-section">
                <div className="store-checkout__items-header">
                  <h2>1. Camisas y Productos Seleccionados ({grandTotalQty})</h2>
                </div>

                <div className="store-checkout__items-list">
                  {cart.map((item) => (
                    <div className="store-cart-card" key={item.id}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productTitle}
                          className="store-cart-card__thumb"
                        />
                      ) : (
                        <div className="store-cart-card__thumb store-cart-card__thumb--placeholder">
                          JDJ
                        </div>
                      )}
                      <div className="store-cart-card__details">
                        <strong>{item.productTitle}</strong>
                        <div className="store-cart-card__tags">
                          <span className="tag">Talla: {item.size || "Única"}</span>
                          {item.color ? <span className="tag">Color: {item.color}</span> : null}
                        </div>
                        <span className="store-cart-card__unit-price">
                          Precio unitario: {formatUsd(item.productPrice)}
                        </span>
                      </div>
                      <div className="store-cart-card__controls">
                        <div className="store-qty-box">
                          <button
                            type="button"
                            className="store-qty-btn"
                            title="Disminuir cantidad"
                            onClick={() => updateQty(item.id, -1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={item.withoutStock ? 50 : item.maxStock || 50}
                            value={item.quantity}
                            onChange={(e) => setDirectQty(item.id, Number(e.target.value) || 1)}
                          />
                          <button
                            type="button"
                            className="store-qty-btn"
                            title="Aumentar cantidad"
                            disabled={!item.withoutStock && item.quantity >= item.maxStock}
                            onClick={() => updateQty(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <span className="store-cart-card__subtotal">
                          {formatUsd(item.productPrice * item.quantity)}
                        </span>
                        <button
                          type="button"
                          className="store-cart-card__remove"
                          title="Eliminar de mi pedido"
                          onClick={() => removeItem(item.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="store-checkout__more-action">
                  <Link to="/tienda" className="btn btn--ghost">
                    + Agregar otra camisa o producto
                  </Link>
                </div>
              </div>

              <div className="store-checkout__summary-section">
                <div className="store-checkout-card">
                  <h2>2. Datos y Confirmación</h2>

                  <p className="checkout-shipping-note">
                    * Costo de envío: A coordinar en WhatsApp.
                  </p>

                  <form onSubmit={(e) => void submitOrder(e)} className="store-checkout-form">
                    <label>
                      Nombre y Apellido *
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre completo"
                        required
                      />
                    </label>
                    <label>
                      Correo electrónico *
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                      />
                    </label>
                    <label>
                      Teléfono / WhatsApp *
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="70123456"
                        required
                      />
                    </label>
                    <label>
                      Parroquia, Movimiento o Asociación * (Obligatorio)
                      <input
                        value={parish}
                        onChange={(e) => setParish(e.target.value)}
                        placeholder="Ej. Parroquia San José, Movimiento..."
                        required
                      />
                      <small className="field-hint">
                        Requerido para agrupar tu pedido correctamente para el encuentro.
                      </small>
                    </label>
                    <label>
                      1. Vicaría
                      <input
                        value={vicariate}
                        onChange={(e) => setVicariate(e.target.value)}
                        placeholder="Ej. Vicaría San José"
                      />
                    </label>
                    <label>
                      2. Municipio
                      <input
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                        placeholder="Ej. Jayaque"
                      />
                    </label>
                    <label>
                      3. Departamento
                      <input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Ej. La Libertad"
                      />
                    </label>
                    <label>
                      Alguna indicación extra de tu pedido (opcional)
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Alguna indicación extra de tu pedido"
                      />
                    </label>

                    <div className="store-checkout__totals">
                      <div className="row">
                        <span>Total de unidades:</span>
                        <strong>{grandTotalQty} camisas</strong>
                      </div>
                      <div className="row">
                        <span>Costo de envío:</span>
                        <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>A coordinar en WhatsApp</span>
                      </div>
                      <div className="row grand-total">
                        <span>Total a pagar:</span>
                        <strong>{formatUsd(grandTotalPrice)}</strong>
                      </div>
                    </div>

                    {notice ? <p className="store-page__notice">{notice}</p> : null}

                    <button
                      type="submit"
                      className="store-card__cta store-checkout__submit"
                      disabled={sending || grandTotalQty <= 0 || !whatsappReady}
                    >
                      {sending
                        ? "Registrando pedido..."
                        : !whatsappReady
                          ? "WhatsApp pendiente de configurar"
                          : `Confirmar por WhatsApp (${formatUsd(grandTotalPrice)})`}
                    </button>
                    <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>
                      🔒 El pago es por transferencia tras enviar tu pedido por WhatsApp.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

