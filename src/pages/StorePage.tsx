import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { PageHero } from "../components/PageHero";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import type { StoreProduct } from "../data/defaultContent";
import {
  applyStockMap,
  formatUsd,
  isProductComingSoon,
  normalizeWhatsapp,
  productImages,
  productRevealLabel,
  productStock,
  sortProductsBySection,
  STORE_MYSTERY_SHIRT,
  variantLabel,
  type StoreStockMap,
} from "../utils/store";
import {
  loadStoreCart,
  saveStoreCart,
  type StoreCartItem,
} from "../utils/storeCart";
import "./StorePage.css";

type Checkout = {
  product: StoreProduct;
  name: string;
  email: string;
  phone: string;
  quantities: Record<string, number>;
  note: string;
};

export function StorePage() {
  const navigate = useNavigate();
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { store, site } = content;
  const [liveStock, setLiveStock] = useState<StoreStockMap | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [cart, setCart] = useState<StoreCartItem[]>(loadStoreCart);
  const [modalImgIndex, setModalImgIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50, isZoomed: false });
  const [gallery, setGallery] = useState<{ product: StoreProduct; index: number } | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const [selectedSection, setSelectedSection] = useState<"ALL" | "JDJ" | "PJA">("ALL");

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
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StoreCartItem[]>;
      if (customEvent.detail) setCart(customEvent.detail);
    };
    window.addEventListener("jdj-cart-update", handleCartUpdate);
    return () => window.removeEventListener("jdj-cart-update", handleCartUpdate);
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
    () => sortProductsBySection(applyStockMap(store.products, liveStock)),
    [liveStock, store.products],
  );

  const visibleProducts = useMemo(() => {
    if (selectedSection === "ALL") return products;
    return products.filter((item) => (item.section || "JDJ") === selectedSection);
  }, [products, selectedSection]);

  const buyableProducts = useMemo(
    () => products.filter((item) => !isProductComingSoon(item)),
    [products],
  );
  const whatsappReady = Boolean(normalizeWhatsapp(store.whatsapp));
  const selectedItems = useMemo(() => {
    if (!checkout) return [];
    const list: Array<{ variant: StoreProduct["variants"][number]; qty: number }> = [];
    for (const variant of checkout.product.variants) {
      const qty = checkout.quantities[variant.id] || 0;
      if (qty > 0) {
        list.push({ variant, qty });
      }
    }
    return list;
  }, [checkout]);

  const grandTotalQty = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.qty, 0),
    [selectedItems],
  );

  const grandTotalPrice = useMemo(() => {
    if (!checkout) return 0;
    return grandTotalQty * checkout.product.price;
  }, [checkout, grandTotalQty]);

  function setVariantQty(variantId: string, qty: number) {
    if (!checkout) return;
    const variant = checkout.product.variants.find((v) => v.id === variantId);
    if (!variant) return;
    const max = checkout.product.withoutStock ? 50 : Math.max(0, variant.stock);
    const validQty = Math.min(Math.max(0, qty), max);
    setCheckout({
      ...checkout,
      quantities: {
        ...checkout.quantities,
        [variantId]: validQty,
      },
    });
  }



  const cartTotalQty = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const cartTotalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.productPrice, 0),
    [cart],
  );

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const currentTarget = e.currentTarget;
    if (!currentTarget) return;
    const rect = currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    const x = isNaN(rawX) || !isFinite(rawX) ? 50 : Math.max(0, Math.min(100, rawX));
    const y = isNaN(rawY) || !isFinite(rawY) ? 50 : Math.max(0, Math.min(100, rawY));

    setZoomPos((prev) => ({
      x,
      y,
      isZoomed: !prev.isZoomed,
    }));
  }

  function handleImageMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomPos.isZoomed) return;
    const currentTarget = e.currentTarget;
    if (!currentTarget) return;
    const rect = currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    const x = isNaN(rawX) || !isFinite(rawX) ? 50 : Math.max(0, Math.min(100, rawX));
    const y = isNaN(rawY) || !isFinite(rawY) ? 50 : Math.max(0, Math.min(100, rawY));

    setZoomPos({
      x,
      y,
      isZoomed: true,
    });
  }

  function handleImageMouseLeave() {
    setZoomPos((prev) => (prev.isZoomed ? { ...prev, isZoomed: false } : prev));
  }

  function openCheckout(product: StoreProduct) {
    if (isProductComingSoon(product)) return;
    setNotice("");
    setModalImgIndex(0);
    setZoomPos({ x: 50, y: 50, isZoomed: false });
    const initialQty: Record<string, number> = {};
    for (const variant of product.variants) {
      initialQty[variant.id] = 0;
    }
    setCheckout({
      product,
      name: "",
      email: "",
      phone: "",
      quantities: initialQty,
      note: "",
    });
  }

  function handleAddToCartOnly() {
    if (!checkout || grandTotalQty <= 0) return;
    const currentCart = loadStoreCart();
    const nextCart = [...currentCart];
    const photos = productImages(checkout.product);
    for (const item of selectedItems) {
      const cartItemId = `${checkout.product.id}:${item.variant.id}`;
      const existingIndex = nextCart.findIndex((c) => c.id === cartItemId);
      if (existingIndex >= 0) {
        nextCart[existingIndex] = {
          ...nextCart[existingIndex],
          quantity: nextCart[existingIndex].quantity + item.qty,
        };
      } else {
        nextCart.push({
          id: cartItemId,
          productId: checkout.product.id,
          productTitle: checkout.product.title,
          productPrice: checkout.product.price,
          imageUrl: photos[0] || "",
          variantId: item.variant.id,
          size: item.variant.size,
          color: item.variant.color,
          quantity: item.qty,
          withoutStock: Boolean(checkout.product.withoutStock),
          maxStock: item.variant.stock || 50,
        });
      }
    }
    saveStoreCart(nextCart);
    setCart(nextCart);
    setCheckout(null);
    setNotice(`✔ ${grandTotalQty} camisa(s) agregada(s) a tu pedido.`);
  }

  function handleAddToCartAndProceed() {
    handleAddToCartOnly();
    navigate("/tienda/pedido");
  }

  return (
    <div className={`app${store.heroImageUrl ? " has-hero" : ""}`}>
      <Navbar />
      <PageHero
        src={store.heroImageUrl || ""}
        alt={`Tienda ${store.title}`}
      />
      <main>
        <section className={`section store-page${store.heroImageUrl ? " has-hero" : ""}`} ref={ref}>
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
              <h1 className="section__title store-title--single-line">{store.title}</h1>
              {store.lead &&
              store.lead !==
                "Camisas y recuerdos de la JDJ 2026. Pides por WhatsApp y pagas por transferencia." ? (
                <p className="section__lead">{store.lead}</p>
              ) : null}
              {store.paymentNote ? (
                <p className="store-page__pay">{store.paymentNote}</p>
              ) : null}
              <div className="store-intro__actions">
                <Link to="/tienda/pedido" className="store-cart-btn">
                  <svg
                    className="store-cart-btn__icon"
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span className="store-cart-btn__text">Ver mi pedido</span>
                  {cartTotalQty > 0 ? (
                    <span className="store-cart-btn__badge">{cartTotalQty}</span>
                  ) : null}
                </Link>
              </div>

              {products.length > 0 ? (
                <div className="store-section-filters reveal">
                  <button
                    type="button"
                    className={`store-section-filter__btn ${selectedSection === "ALL" ? "is-active" : ""}`}
                    onClick={() => setSelectedSection("ALL")}
                  >
                    <span>Todas las camisas</span>
                    <span className="store-section-filter__count">{products.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`store-section-filter__btn ${selectedSection === "JDJ" ? "is-active" : ""}`}
                    onClick={() => setSelectedSection("JDJ")}
                  >
                    <span>Sección JDJ</span>
                    <span className="store-section-filter__count">
                      {products.filter((p) => (p.section || "JDJ") === "JDJ").length}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`store-section-filter__btn ${selectedSection === "PJA" ? "is-active" : ""}`}
                    onClick={() => setSelectedSection("PJA")}
                  >
                    <span>Sección PJA</span>
                    <span className="store-section-filter__count">
                      {products.filter((p) => p.section === "PJA").length}
                    </span>
                  </button>
                </div>
              ) : null}
            </div>

            {products.length === 0 ? (
              <p className="store-page__empty reveal">
                Pronto habrá camisas y recuerdos en esta tienda.
              </p>
            ) : (
              <div className="store-page__grid">
                {visibleProducts.map((product) => {
                  if (isProductComingSoon(product)) {
                    const reveal = productRevealLabel(product);
                    return (
                      <article
                        className="store-card store-card--soon reveal"
                        key={product.id}
                      >
                        <div className="store-card__media store-card__media--mystery">
                          <img
                            src={STORE_MYSTERY_SHIRT}
                            alt=""
                            width={640}
                            height={640}
                          />
                          <span className="store-card__badge">Próximamente</span>
                        </div>
                        <div className="store-card__body">
                          <h2>?????</h2>
                          <p>Muy pronto disponible</p>
                          <span className="store-card__section-tag">
                            Sección {product.section || "JDJ"}
                          </span>
                          {reveal ? (
                            <p className="store-card__reveal">{reveal}</p>
                          ) : null}
                        </div>
                      </article>
                    );
                  }
                  const total = productStock(product);
                  const soldOut = !product.withoutStock && total <= 0;
                  const images = productImages(product);
                  const cover = images[0];
                  const secondPhoto = images[1];
                  return (
                    <article
                      className={`store-card reveal${soldOut ? " is-soldout" : ""}`}
                      key={product.id}
                    >
                      <div className="store-card__media">
                        {cover ? (
                          <button
                            type="button"
                            className="store-card__media-btn"
                            disabled={soldOut}
                            onClick={() => openCheckout(product)}
                            aria-label={`Pedir ${product.title}`}
                          >
                            <img
                              className="store-card__img store-card__img--primary"
                              src={cover}
                              alt={product.title}
                              width={640}
                              height={640}
                            />
                            {secondPhoto ? (
                              <img
                                className="store-card__img store-card__img--secondary"
                                src={secondPhoto}
                                alt=""
                                width={640}
                                height={640}
                              />
                            ) : null}
                            {images.length > 1 ? (
                              <span className="store-card__photos-count">
                                {images.length} fotos
                              </span>
                            ) : null}
                          </button>
                        ) : (
                          <div className="store-card__placeholder">JDJ</div>
                        )}
                        {soldOut ? (
                          <span className="store-card__badge">Agotado</span>
                        ) : product.withoutStock ? null : (
                          <span className="store-card__stock">
                            {total} {total === 1 ? "disponible" : "disponibles"}
                          </span>
                        )}
                      </div>
                      <div className="store-card__body">
                        <h2>{product.title}</h2>
                        {product.description ? <p>{product.description}</p> : null}
                        <span className="store-card__section-tag">
                          Sección {product.section || "JDJ"}
                        </span>
                        {variantSummary(product) ? (
                          <p className="store-card__variants">
                            {variantSummary(product)}
                          </p>
                        ) : null}
                        <p className="store-card__price">
                          {formatUsd(product.price)}
                        </p>
                        <button
                          type="button"
                          className="store-card__cta"
                          disabled={soldOut}
                          onClick={() => openCheckout(product)}
                        >
                          {soldOut ? "Agotado" : store.ctaLabel || "Agregar al pedido"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {products.length > 0 ? (
              <p className="store-page__aviso reveal">
                Espera próximos productos muy pronto. Estate atento a nuestras
                redes sociales.
              </p>
            ) : null}
            {!whatsappReady && buyableProducts.length > 0 ? (
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

      {cartTotalQty > 0 ? (
        <div className="store-floating-cart">
          <div className="store-floating-cart__info">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>
              {cartTotalQty} {cartTotalQty === 1 ? "producto" : "productos"}
            </span>
            <span className="store-floating-cart__price">
              ({formatUsd(cartTotalPrice)})
            </span>
          </div>
          <Link to="/tienda/pedido" className="store-floating-cart__btn">
            <span>Ver mi pedido</span>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      ) : null}

      {gallery ? (
        <ProductGallery
          product={gallery.product}
          index={gallery.index}
          onIndex={(index) => setGallery({ ...gallery, index })}
          onClose={() => setGallery(null)}
        />
      ) : null}

      {checkout ? (() => {
        const modalImages = productImages(checkout.product);
        const currentModalImg = modalImages[modalImgIndex] || modalImages[0] || "";
        return (
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
              onClick={() => setCheckout(null)}
            />
            <form
              className="store-modal__card"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddToCartAndProceed();
              }}
            >
              <button
                type="button"
                className="store-modal__close-btn"
                aria-label="Cerrar modal"
                onClick={() => setCheckout(null)}
              >
                ✕
              </button>
              <div className="store-modal__grid">
                <div className="store-modal__media">
                  <div
                    className={`store-modal__image-wrapper ${zoomPos.isZoomed ? "is-active-zoom" : ""}`}
                    onClick={handleImageClick}
                    onMouseMove={handleImageMouseMove}
                    onMouseLeave={handleImageMouseLeave}
                  >
                    {currentModalImg ? (
                      <img
                        src={currentModalImg}
                        alt={checkout.product.title}
                        className={`store-modal__zoom-img ${zoomPos.isZoomed ? "is-zoomed" : ""}`}
                        style={{
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        }}
                      />
                    ) : (
                      <div className="store-modal__image-placeholder">JDJ</div>
                    )}
                    {modalImages.length > 1 ? (
                      <>
                        <button
                          type="button"
                          className="store-modal__nav is-prev"
                          aria-label="Foto anterior"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomPos({ x: 50, y: 50, isZoomed: false });
                            setModalImgIndex((prev) =>
                              prev > 0 ? prev - 1 : modalImages.length - 1
                            );
                          }}
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="store-modal__nav is-next"
                          aria-label="Foto siguiente"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomPos({ x: 50, y: 50, isZoomed: false });
                            setModalImgIndex((prev) =>
                              prev < modalImages.length - 1 ? prev + 1 : 0
                            );
                          }}
                        >
                          ›
                        </button>
                      </>
                    ) : null}
                  </div>
                  {modalImages.length > 1 ? (
                    <div className="store-modal__dots" role="tablist">
                      {modalImages.map((url, i) => (
                        <button
                          key={`${url}-${i}`}
                          type="button"
                          className={i === modalImgIndex ? "is-active" : ""}
                          aria-label={`Foto ${i + 1}`}
                          onClick={() => setModalImgIndex(i)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="store-modal__content">
                  <p className="store-modal__eyebrow">Selecciona Tallas y Cantidades</p>
                  <h2 id="store-checkout-title">{checkout.product.title}</h2>
                  <p className="store-modal__price">
                    {formatUsd(checkout.product.price)} · pago por transferencia
                  </p>
                  <div className="store-modal__variants-section">
                    <label>Selecciona las tallas y cantidades:</label>
                    <div className="store-modal__variants-list">
                      {checkout.product.variants.map((variant) => {
                        const qty = checkout.quantities[variant.id] || 0;
                        const isOut =
                          !checkout.product.withoutStock && variant.stock <= 0;
                        return (
                          <div className="store-modal-variant-row" key={variant.id}>
                            <div className="store-modal-variant-info">
                              <strong>Talla {variant.size || "Única"}</strong>
                              {variant.color ? (
                                <span>Color: {variant.color}</span>
                              ) : null}
                              {!checkout.product.withoutStock ? (
                                <small className={isOut ? "is-out" : ""}>
                                  {isOut
                                    ? "Agotada"
                                    : `${variant.stock} disponible(s)`}
                                </small>
                              ) : null}
                            </div>
                            <div className="store-modal-qty-control">
                              <button
                                type="button"
                                className="store-qty-btn"
                                disabled={qty <= 0 || isOut}
                                onClick={() => setVariantQty(variant.id, qty - 1)}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={
                                  checkout.product.withoutStock
                                    ? 50
                                    : variant.stock
                                }
                                value={qty}
                                disabled={isOut}
                                onChange={(e) =>
                                  setVariantQty(variant.id, Number(e.target.value) || 0)
                                }
                              />
                              <button
                                type="button"
                                className="store-qty-btn"
                                disabled={
                                  isOut ||
                                  (!checkout.product.withoutStock &&
                                    qty >= variant.stock)
                                }
                                onClick={() => setVariantQty(variant.id, qty + 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="store-modal__total">
                    Total ({grandTotalQty} {grandTotalQty === 1 ? "camisa" : "camisas"}):{" "}
                    {formatUsd(grandTotalPrice)}
                  </p>
                  {notice ? <p className="store-page__notice">{notice}</p> : null}
                  <div className="store-modal__actions">
                    <button
                      type="button"
                      className="store-modal__btn-add"
                      disabled={grandTotalQty <= 0}
                      onClick={handleAddToCartOnly}
                    >
                      + Guardar en pedido
                    </button>
                    <button
                      type="button"
                      className="store-modal__btn-proceed"
                      disabled={grandTotalQty <= 0}
                      onClick={handleAddToCartAndProceed}
                    >
                      Ir al resumen de pedido →
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        );
      })() : null}

      {cartTotalQty > 0 ? (
        <div className="store-floating-cart">
          <div className="store-floating-cart__info">
            <span>🛒 Tu pedido:</span>
            <strong>
              {cartTotalQty} {cartTotalQty === 1 ? "camisa" : "camisas"} (
              {formatUsd(cartTotalPrice)})
            </strong>
          </div>
          <Link to="/tienda/pedido" className="store-floating-cart__btn">
            Ir al resumen de pedido →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function variantSummary(product: StoreProduct) {
  if (product.withoutStock) return "";
  const available = product.variants.filter((item) => item.stock > 0);
  if (!available.length) return "Sin unidades por talla";
  return available
    .map((item) => `${variantLabel(item)} ${item.stock}`)
    .join(" · ");
}

function ProductGallery({
  product,
  index,
  onIndex,
  onClose,
}: {
  product: StoreProduct;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const images = productImages(product);
  const total = images.length;
  const current = images[index] || images[0];
  const touchStart = useRef<number | null>(null);

  function go(delta: number) {
    if (total < 2) return;
    onIndex((index + delta + total) % total);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (total < 2) return;
      if (event.key === "ArrowRight") onIndex((index + 1) % total);
      if (event.key === "ArrowLeft") onIndex((index - 1 + total) % total);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, onClose, onIndex]);

  return (
    <div
      className="store-gallery"
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${product.title}`}
    >
      <button
        type="button"
        className="store-gallery__backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="store-gallery__card"
        onTouchStart={(event) => {
          touchStart.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const end = event.changedTouches[0]?.clientX;
          touchStart.current = null;
          if (start == null || end == null) return;
          const delta = end - start;
          if (delta > 40) go(-1);
          if (delta < -40) go(1);
        }}
      >
        <p className="store-gallery__eyebrow">
          {total > 1 ? `${index + 1} / ${total}` : "Foto"}
        </p>
        <h2>{product.title}</h2>
        <div className="store-gallery__stage">
          {current ? (
            <img
              src={current}
              alt={`${product.title}, foto ${index + 1} de ${total}`}
            />
          ) : null}
          {total > 1 ? (
            <>
              <button
                type="button"
                className="store-gallery__nav is-prev"
                aria-label="Foto anterior"
                onClick={() => go(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="store-gallery__nav is-next"
                aria-label="Foto siguiente"
                onClick={() => go(1)}
              >
                ›
              </button>
            </>
          ) : null}
        </div>
        {total > 1 ? (
          <div className="store-gallery__dots" role="tablist" aria-label="Fotos">
            {images.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={i === index ? "is-active" : ""}
                aria-label={`Foto ${i + 1}`}
                onClick={() => onIndex(i)}
              />
            ))}
          </div>
        ) : null}
        <button type="button" className="store-gallery__close" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
