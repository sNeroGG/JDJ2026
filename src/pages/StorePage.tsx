import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import type { StoreProduct } from "../data/defaultContent";
import {
  applyStockMap,
  findVariant,
  firstAvailableVariant,
  formatUsd,
  normalizeWhatsapp,
  productColors,
  productSizes,
  productStock,
  variantLabel,
  whatsappOrderUrl,
  type StoreStockMap,
} from "../utils/store";
import "./StorePage.css";

type Checkout = {
  product: StoreProduct;
  name: string;
  email: string;
  phone: string;
  size: string;
  color: string;
  quantity: number;
  note: string;
};

const EMPTY_CHECKOUT: Omit<Checkout, "product"> = {
  name: "",
  email: "",
  phone: "",
  size: "",
  color: "",
  quantity: 1,
  note: "",
};

export function StorePage() {
  const ref = useReveal<HTMLElement>();
  const { content, updateContent } = useContent();
  const { store, site } = content;
  const [liveStock, setLiveStock] = useState<StoreStockMap | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  useSeo({
    title: `${store.title} · ${site.name} ${site.year}`,
    description: store.lead || site.metaDescription,
    path: "/tienda",
    siteUrl: site.url,
    image: store.logoUrl || site.ogImage,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    void fetch("/api/store")
      .then(async (remote) => {
        if (!remote.ok) return;
        const payload = (await remote.json()) as { stock?: StoreStockMap };
        if (payload.stock) setLiveStock(payload.stock);
      })
      .catch(() => undefined);
  }, []);

  const products = useMemo(
    () => applyStockMap(store.products, liveStock),
    [liveStock, store.products],
  );

  const whatsappReady = Boolean(normalizeWhatsapp(store.whatsapp));
  const selected = checkout
    ? findVariant(checkout.product, checkout)
    : undefined;
  const selectedStock = selected?.stock ?? 0;
  const checkoutColors = checkout ? productColors(checkout.product) : [];
  const checkoutSizes = checkout
    ? productSizes(checkout.product, checkout.color)
    : [];

  function openCheckout(product: StoreProduct) {
    const variant = firstAvailableVariant(product);
    setNotice("");
    setCheckout({
      product,
      ...EMPTY_CHECKOUT,
      size: variant?.size || "",
      color: variant?.color || "",
      quantity: 1,
    });
  }

  function patchVariantStock(
    productId: string,
    variantId: string,
    stock: number,
  ) {
    setLiveStock((prev) => ({
      ...(prev ?? {}),
      [productId]: {
        ...(prev?.[productId] ?? {}),
        [variantId]: stock,
      },
    }));
    updateContent((prev) => ({
      ...prev,
      store: {
        ...prev.store,
        products: prev.store.products.map((item) =>
          item.id === productId
            ? {
                ...item,
                variants: item.variants.map((variant) =>
                  variant.id === variantId ? { ...variant, stock } : variant,
                ),
              }
            : item,
        ),
      },
    }));
  }

  function setCheckoutVariant(
    patch: Partial<Pick<Checkout, "size" | "color" | "quantity">>,
  ) {
    if (!checkout) return;
    const next = { ...checkout, ...patch };
    const variant = findVariant(next.product, next);
    const max = Math.max(1, variant?.stock ?? 1);
    setCheckout({
      ...next,
      quantity: Math.min(Math.max(1, next.quantity), max),
    });
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (!checkout) return;
    setSending(true);
    setNotice("");
    try {
      const variant = findVariant(checkout.product, checkout);
      const remote = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: checkout.name,
          email: checkout.email,
          phone: checkout.phone,
          productId: checkout.product.id,
          variantId: variant?.id || "",
          size: checkout.size,
          color: checkout.color,
          quantity: checkout.quantity,
          note: checkout.note,
        }),
      });
      const payload = (await remote.json().catch(() => null)) as {
        error?: string;
        order?: Parameters<typeof whatsappOrderUrl>[1];
        stock?: number;
        variantId?: string;
        whatsappUrl?: string;
      } | null;
      if (!remote.ok || !payload?.order) {
        setNotice(payload?.error || "No se pudo registrar el pedido.");
        return;
      }
      if (typeof payload.stock === "number" && payload.variantId) {
        patchVariantStock(
          checkout.product.id,
          payload.variantId,
          payload.stock,
        );
      }
      const url =
        payload.whatsappUrl ||
        whatsappOrderUrl(store.whatsapp, payload.order);
      setCheckout(null);
      if (!url) {
        setNotice(
          `Pedido ${payload.order.id} registrado. Configura WhatsApp en el panel para enviarlo.`,
        );
        return;
      }
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) window.location.href = url;
    } catch {
      setNotice("No se pudo conectar. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main>
        <section className="section store-page" ref={ref}>
          <div className="section__inner">
            <div className="store-page__intro reveal">
              {store.logoUrl ? (
                <img
                  className="store-page__logo"
                  src={store.logoUrl}
                  alt={`Logo de ${store.title}`}
                  width={280}
                  height={141}
                />
              ) : null}
              <p className="section__eyebrow">{store.eyebrow}</p>
              <h1 className="section__title">{store.title}</h1>
              <p className="section__lead">{store.lead}</p>
              {store.paymentNote ? (
                <p className="store-page__pay">{store.paymentNote}</p>
              ) : null}
            </div>

            {products.length === 0 ? (
              <p className="store-page__empty reveal">
                Pronto habrá camisas y recuerdos en esta tienda.
              </p>
            ) : (
              <div className="store-page__grid">
                {products.map((product) => {
                  const total = productStock(product);
                  const soldOut = total <= 0;
                  return (
                    <article
                      className={`store-card reveal${soldOut ? " is-soldout" : ""}`}
                      key={product.id}
                    >
                      <div className="store-card__media">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            width={640}
                            height={640}
                          />
                        ) : (
                          <div className="store-card__placeholder">JDJ</div>
                        )}
                        {soldOut ? (
                          <span className="store-card__badge">Agotado</span>
                        ) : (
                          <span className="store-card__stock">
                            {total} {total === 1 ? "disponible" : "disponibles"}
                          </span>
                        )}
                      </div>
                      <div className="store-card__body">
                        <h2>{product.title}</h2>
                        {product.description ? <p>{product.description}</p> : null}
                        <p className="store-card__variants">
                          {variantSummary(product)}
                        </p>
                        <p className="store-card__price">
                          {formatUsd(product.price)}
                        </p>
                        <button
                          type="button"
                          className="store-card__cta"
                          disabled={soldOut || !whatsappReady}
                          onClick={() => openCheckout(product)}
                        >
                          {soldOut
                            ? "Agotado"
                            : whatsappReady
                              ? store.ctaLabel
                              : "WhatsApp pendiente"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {!whatsappReady && products.length > 0 ? (
              <p className="store-page__hint">
                Falta el número de WhatsApp. Se configura en el panel de
                administración.
              </p>
            ) : null}
            {notice ? <p className="store-page__notice">{notice}</p> : null}
          </div>
        </section>
      </main>
      <Footer />

      {checkout ? (
        <div
          className="store-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="store-checkout-title"
        >
          <button
            type="button"
            className="store-modal__backdrop"
            aria-label="Cerrar"
            onClick={() => !sending && setCheckout(null)}
          />
          <form className="store-modal__card" onSubmit={(e) => void submitOrder(e)}>
            <p className="store-modal__eyebrow">Pedido</p>
            <h2 id="store-checkout-title">{checkout.product.title}</h2>
            <p className="store-modal__price">
              {formatUsd(checkout.product.price)} · pago por transferencia
            </p>
            <label>
              Nombre
              <input
                value={checkout.name}
                onChange={(e) =>
                  setCheckout({ ...checkout, name: e.target.value })
                }
                autoComplete="name"
                required
              />
            </label>
            <label>
              Correo
              <input
                type="email"
                value={checkout.email}
                onChange={(e) =>
                  setCheckout({ ...checkout, email: e.target.value })
                }
                autoComplete="email"
                required
              />
            </label>
            <label>
              Teléfono
              <input
                type="tel"
                value={checkout.phone}
                onChange={(e) =>
                  setCheckout({ ...checkout, phone: e.target.value })
                }
                autoComplete="tel"
                required
              />
            </label>
            <div className="store-modal__row">
              {checkoutColors.length ? (
                <label>
                  Color
                  <select
                    value={checkout.color}
                    onChange={(e) =>
                      setCheckoutVariant({
                        color: e.target.value,
                        size:
                          productSizes(checkout.product, e.target.value)[0] || "",
                      })
                    }
                    required
                  >
                    {checkoutColors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {checkoutSizes.length ? (
                <label>
                  Talla
                  <select
                    value={checkout.size}
                    onChange={(e) => setCheckoutVariant({ size: e.target.value })}
                    required
                  >
                    {checkoutSizes.map((size) => {
                      const variant = findVariant(checkout.product, {
                        size,
                        color: checkout.color,
                      });
                      const left = variant?.stock ?? 0;
                      return (
                        <option key={size} value={size} disabled={left <= 0}>
                          {size}
                          {left <= 0 ? " (agotada)" : ` (${left})`}
                        </option>
                      );
                    })}
                  </select>
                </label>
              ) : null}
              <label>
                Cantidad
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, selectedStock)}
                  value={checkout.quantity}
                  onChange={(e) =>
                    setCheckoutVariant({
                      quantity: Number(e.target.value) || 1,
                    })
                  }
                  required
                />
              </label>
            </div>
            {selected ? (
              <p className="store-modal__stock">
                {selectedStock > 0
                  ? `${selectedStock} disponible(s) en ${variantLabel(selected)}.`
                  : `${variantLabel(selected)} está agotada.`}
              </p>
            ) : null}
            <label>
              Nota (opcional)
              <textarea
                rows={2}
                value={checkout.note}
                onChange={(e) =>
                  setCheckout({ ...checkout, note: e.target.value })
                }
                placeholder="Parroquia, vicaría o indicaciones de entrega"
              />
            </label>
            <p className="store-modal__total">
              Total: {formatUsd(checkout.product.price * checkout.quantity)}
            </p>
            {notice ? <p className="store-page__notice">{notice}</p> : null}
            <div className="store-modal__actions">
              <button
                type="button"
                className="store-modal__cancel"
                disabled={sending}
                onClick={() => setCheckout(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="store-card__cta"
                disabled={sending || selectedStock < checkout.quantity}
              >
                {sending ? "Enviando…" : "Enviar por WhatsApp"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function variantSummary(product: StoreProduct) {
  const available = product.variants.filter((item) => item.stock > 0);
  if (!available.length) return "Sin unidades por talla";
  return available
    .map((item) => `${variantLabel(item)} ${item.stock}`)
    .join(" · ");
}
