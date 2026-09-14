import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useContent } from "../context/ContentContext";
import { useSeo } from "../hooks/useSeo";
import type { StoreOrder } from "../data/defaultContent";
import { formatUsd, normalizeWhatsapp, whatsappMultiOrderUrl } from "../utils/store";
import {
  clearStoreCart,
  loadStoreCart,
  saveStoreCart,
  type StoreCartItem,
} from "../utils/storeCart";
import "./StorePage.css";

export function StoreCheckoutPage() {
  const navigate = useNavigate();
  const { content } = useContent();
  const { store, site } = content;
  const [cart, setCart] = useState<StoreCartItem[]>(loadStoreCart);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [parish, setParish] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  useSeo({
    title: `Resumen de Pedido · ${store.title} · ${site.name}`,
    description: "Revisa tu pedido de la Tienda JDJ 2026, completa tus datos y confirma por WhatsApp.",
    path: "/tienda/pedido",
    siteUrl: site.url,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StoreCartItem[]>;
      if (customEvent.detail) {
        setCart(customEvent.detail);
      }
    };
    window.addEventListener("jdj-cart-update", handleCartUpdate);
    return () => window.removeEventListener("jdj-cart-update", handleCartUpdate);
  }, []);

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
      setNotice("Escribe tu Parroquia o Movimiento al que perteneces.");
      return;
    }

    setSending(true);
    setNotice("");

    try {
      const createdOrders: StoreOrder[] = [];
      for (const item of cart) {
        const remote = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            parish,
            productId: item.productId,
            variantId: item.variantId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            note,
          }),
        });
        const payload = (await remote.json().catch(() => null)) as {
          error?: string;
          order?: StoreOrder;
        } | null;
        if (!remote.ok || !payload?.order) {
          setNotice(payload?.error || "No se pudo registrar una de las líneas.");
          setSending(false);
          return;
        }
        createdOrders.push(payload.order);
      }

      const waUrl = whatsappMultiOrderUrl(store.whatsapp, createdOrders, {
        name,
        email,
        phone,
        parish,
        note,
      });

      clearStoreCart();
      setCart([]);

      if (!waUrl) {
        setNotice("Pedido registrado correctamente. Configura WhatsApp en el panel.");
        return;
      }

      const opened = window.open(waUrl, "_blank", "noopener,noreferrer");
      if (!opened) window.location.href = waUrl;
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
            <h1 className="store-checkout__title">Resumen de tu Pedido</h1>
            <p className="store-checkout__subtitle">
              Revisa las camisas y tallas seleccionadas, ingresa tus datos de parroquia o grupo y confirma tu solicitud por WhatsApp.
            </p>
            <div className="store-checkout__steps">
              <span className="step is-active">1. Productos</span>
              <span className="step-arrow">→</span>
              <span className="step is-active">2. Parroquia / Datos</span>
              <span className="step-arrow">→</span>
              <span className="step">3. Confirmación por WhatsApp</span>
            </div>
          </div>

          {cart.length === 0 ? (
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

                  <div className="checkout-shipping-alert">
                    <span className="checkout-shipping-alert__icon" role="img" aria-label="Envío">
                      🚚
                    </span>
                    <div className="checkout-shipping-alert__text">
                      <strong>Información sobre el Envío</strong>
                      <p>
                        Este precio no incluye costo de envío. Todos los pedidos se entregan sin costo adicional en el punto de encuentro de la <strong>JDJ Jayaque 2026</strong>. Si necesitas envío a domicilio, se coordinará por WhatsApp tras confirmar.
                      </p>
                    </div>
                  </div>

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
                      Parroquia o Movimiento al que pertenecen * (Obligatorio)
                      <input
                        value={parish}
                        onChange={(e) => setParish(e.target.value)}
                        placeholder="Ej. Parroquia San José, Vicaría Romero, Movimiento..."
                        required
                      />
                      <small className="field-hint">
                        Requerido para agrupar tu pedido correctamente para el encuentro.
                      </small>
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
                        <span>Envío:</span>
                        <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>A coordinar por WhatsApp</span>
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
