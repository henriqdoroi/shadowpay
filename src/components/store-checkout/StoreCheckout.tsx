/**
 * Checkout "Loja" — layout de e-commerce mobile-first (produto, entrega,
 * envio, pagamento, faturamento, resumo e barra fixa com o total).
 *
 * Quem decide o valor é o servidor: o resumo mostra a cotação de
 * POST /api/sales/public/quote (cupom, desconto do PIX, frete) e a venda é
 * criada em POST /api/sales/public com uma chave de idempotência — dois
 * cliques não geram duas cobranças.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "sonner";
import {
  AlertCircle,
  Banknote,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Package,
  Pencil,
  Plus,
  Ticket,
  Truck,
  Wallet,
} from "lucide-react";
import {
  Address,
  ApiError,
  Billing,
  Quote,
  StoreConfig,
  brl,
  cpfHint,
  createSale,
  deliveryWindow,
  digits,
  fetchQuote,
  newCheckoutKey,
} from "./lib";
import { AddressSheet, BillingFields, BillingSheet, CouponSheet, addressErrors, addressLine, billingErrors } from "./forms";
import { Money, StoreHeader, StoreRoot, s } from "./ui";

export type StoreBump = { id: string; title: string; description: string; priceCents: number };
type Method = { enabled: boolean; percent: number };

export type StoreCheckoutProps = {
  productId: string;
  name: string;
  priceCents: number;
  imageUrl?: string | null;
  logoUrl?: string | null;
  /** cor da barra do topo (identidade do seller) */
  brandColor: string;
  tag?: string | null;
  variant?: string | null;
  paymentMethods: Record<string, Method | undefined>;
  bumps: StoreBump[];
  fields: BillingFields;
  store: StoreConfig;
  onBack: (() => void) | null;
  /** UTMs/src/sck/ids de clique (mesma origem do checkout padrão) */
  attribution: () => Record<string, unknown>;
  onInitiateCheckout?: (valueReais: number) => void;
};

const METHODS: { key: string; label: string; icon: React.ReactNode; available: boolean }[] = [
  { key: "pix", label: "Pix", icon: <img src="/icons/pix.png" alt="" />, available: true },
  { key: "cartao", label: "Cartão de crédito", icon: <CreditCard size={24} />, available: false },
  { key: "boleto", label: "Boleto bancário", icon: <Banknote size={24} />, available: false },
  { key: "picpay", label: "PicPay", icon: <img src="/icons/picpay.png" alt="" />, available: false },
  { key: "googlepay", label: "Google Pay", icon: <Wallet size={24} />, available: false },
  { key: "applepay", label: "Apple Pay", icon: <Wallet size={24} />, available: false },
];

const EMPTY_BILLING: Billing = { name: "", email: "", cpf: "", phone: "" };

export default function StoreCheckout(props: StoreCheckoutProps) {
  const { productId, store, fields, bumps, paymentMethods } = props;
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrIndex, setAddrIndex] = useState(0);
  const address = addresses[addrIndex] ?? null;
  const [billing, setBilling] = useState<Billing>(EMPTY_BILLING);
  const [selectedBumps, setSelectedBumps] = useState<string[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "address" | "billing" | "coupon">(null);
  const [showAllMethods, setShowAllMethods] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const enabledMethods = METHODS.filter((m) => paymentMethods[m.key]?.enabled);
  const firstAvailable = enabledMethods.find((m) => m.available)?.key ?? null;
  const [method, setMethod] = useState<string | null>(firstAvailable);
  useEffect(() => {
    if (!method && firstAvailable) setMethod(firstAvailable);
  }, [firstAvailable, method]);

  const needsAddress = store.requireAddress;
  const hasBilling = fields.nome || fields.email || fields.cpf || fields.celular;
  const pixPercent = Math.min(100, Math.max(0, Number(paymentMethods.pix?.percent) || 0));

  /* ---------- cotação (servidor) ---------- */

  // Enquanto o servidor responde, a mesma conta feita aqui (sem cupom).
  const localQuote = useMemo<Quote>(() => {
    const subtotal = props.priceCents + bumps.filter((b) => selectedBumps.includes(b.id)).reduce((t, b) => t + b.priceCents, 0);
    const goods = pixPercent > 0 ? Math.round((subtotal * (100 - pixPercent)) / 100) : subtotal;
    const ship = needsAddress && store.shipping.mode === "fixed" ? store.shipping.priceCents : 0;
    return {
      subtotalCents: subtotal,
      couponDiscountCents: 0,
      pixDiscountCents: subtotal - goods,
      pixDiscountPercent: pixPercent,
      shippingCents: ship,
      totalCents: goods + ship,
      coupon: null,
    };
  }, [props.priceCents, bumps, selectedBumps, pixPercent, needsAddress, store.shipping]);

  const [serverQuote, setServerQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const quoteSeq = useRef(0);
  const bumpKey = selectedBumps.slice().sort().join(",");

  const runQuote = useCallback(
    async (couponCode: string | null) => {
      const seq = ++quoteSeq.current;
      setQuoting(true);
      try {
        const q = await fetchQuote({ productId, bumpIds: bumpKey ? bumpKey.split(",") : [], couponCode });
        if (seq === quoteSeq.current) setServerQuote(q);
        return { ok: true as const, quote: q };
      } catch (e: any) {
        if (seq === quoteSeq.current) setServerQuote(null);
        return { ok: false as const, error: e as ApiError };
      } finally {
        if (seq === quoteSeq.current) setQuoting(false);
      }
    },
    [productId, bumpKey],
  );

  useEffect(() => {
    let alive = true;
    runQuote(coupon).then((r) => {
      if (!alive || r.ok) return;
      if (r.error.code === "coupon_invalid") {
        setCoupon(null);
        toast.error("O cupom deixou de valer e foi removido.");
      }
    });
    return () => {
      alive = false;
    };
  }, [runQuote, coupon]);

  const quote = serverQuote ?? localQuote;

  /* ---------- chave do pedido (idempotência) ---------- */
  // Mesmo pedido = mesma chave; mudou algo no pedido, chave nova.
  const checkoutKey = useMemo(
    () => newCheckoutKey(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bumpKey, coupon, addrIndex, address, billing, method],
  );

  /* ---------- barra fixa: some o total quando o resumo aparece ---------- */
  const summaryRef = useRef<HTMLElement>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  useEffect(() => {
    const el = summaryRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setSummaryVisible(!!e?.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ---------- validação ---------- */
  const addrMissing = needsAddress && (!address || Object.keys(addressErrors(address)).length > 0);
  const billErrors = hasBilling ? billingErrors(billing, fields) : {};
  const billMissing = Object.keys(billErrors).length > 0;
  const methodMissing = !method;

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });

  const submit = async () => {
    if (submittingRef.current) return;
    setAttempted(true);
    setSubmitError(null);
    if (addrMissing) {
      scrollTo("sc-entrega");
      setSheet("address");
      return;
    }
    if (methodMissing) {
      scrollTo("sc-pagamento");
      toast.error("Escolha um meio de pagamento.");
      return;
    }
    if (billMissing) {
      scrollTo("sc-faturamento");
      setSheet("billing");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    props.onInitiateCheckout?.(quote.totalCents / 100);
    try {
      const sale = await createSale({
        productId,
        bumpIds: selectedBumps,
        paymentType: "PIX",
        couponCode: serverQuote?.coupon?.code ?? coupon ?? undefined,
        // nome: o de faturamento; sem esse campo, o de quem recebe
        name: (fields.nome ? billing.name : address?.recipient) || undefined,
        email: fields.email ? billing.email : undefined,
        document: fields.cpf ? digits(billing.cpf) : undefined,
        celular: fields.celular ? `+55${digits(billing.phone)}` : undefined,
        shippingAddress: needsAddress && address ? { ...address, cep: digits(address.cep) } : undefined,
        checkoutKey,
        ...props.attribution(),
      });
      // sem `submittingRef = false`: a página vai mudar
      router.push(`/v1/checkout/pix/${encodeURIComponent(sale.id)}`);
    } catch (e: any) {
      submittingRef.current = false;
      setSubmitting(false);
      const msg = e?.message || "Não foi possível gerar o Pix. Tente de novo.";
      setSubmitError(msg);
      toast.error(msg);
      if (e?.code === "coupon_invalid") setCoupon(null);
      if (e?.code === "address_invalid") setSheet("address");
    }
  };

  /* ---------- cupom ---------- */
  const applyCoupon = async (code: string): Promise<string | null> => {
    const r = await runQuote(code);
    if (!r.ok) {
      // volta a cotação sem o cupom recusado
      runQuote(coupon);
      return r.error.message || "Cupom inválido.";
    }
    setCoupon(r.quote.coupon?.code ?? code);
    setSheet(null);
    toast.success("Cupom aplicado.");
    return null;
  };

  /* ---------- render ---------- */
  const visibleMethods = showAllMethods ? enabledMethods : enabledMethods.slice(0, 2);
  const shipLabel = needsAddress ? deliveryWindow(store.shipping.daysMin, store.shipping.daysMax) : "";
  const couponRow = store.couponsEnabled && !quote.coupon && (
    <button type="button" className={s.link} onClick={() => setSheet("coupon")}>
      <Ticket size={18} /> Inserir código do cupom
    </button>
  );

  return (
    <StoreRoot brand={props.brandColor}>
      <Head>
        <title>{`${store.title} · ${props.name}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content={props.brandColor} />
        <meta name="robots" content="noindex" />
      </Head>

      <StoreHeader title={store.title} logoUrl={props.logoUrl} onBack={props.onBack} />

      <main className={s.main}>
        {/* produto */}
        <div className={s.product}>
          <div className={s.thumb}>
            {props.imageUrl ? <img src={props.imageUrl} alt="" /> : <Package size={28} />}
          </div>
          <div className={s.productInfo}>
            {props.tag ? <span className={s.tag}>{props.tag}</span> : null}
            <p className={s.productName}>{props.name}</p>
            {props.variant ? <p className={s.productMeta}>{props.variant}</p> : null}
          </div>
        </div>

        {/* entrega */}
        {needsAddress && (
          <section className={s.section} id="sc-entrega" aria-labelledby="sc-entrega-t">
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle} id="sc-entrega-t">
                Forma de entrega
              </h2>
            </div>
            <button
              type="button"
              className={`${s.addressCard} ${address ? "" : s.empty}`}
              onClick={() => setSheet("address")}
            >
              <MapPin size={22} className={s.addressIcon} fill="currentColor" stroke="var(--sc-bg)" />
              <span style={{ minWidth: 0 }}>
                {address ? (
                  <>
                    <span className={s.addressLine} style={{ display: "block" }}>
                      {addressLine(address)}
                    </span>
                    <span className={s.addressSub} style={{ display: "block" }}>
                      {address.district} · {address.city}/{address.state}
                      {address.complement ? ` · ${address.complement}` : ""}
                    </span>
                    <span className={s.link} style={{ marginTop: 6 }}>
                      Alterar endereço
                    </span>
                  </>
                ) : (
                  <>
                    <span className={s.addressLine} style={{ display: "block" }}>
                      Adicionar endereço de entrega
                    </span>
                    <span className={s.link} style={{ marginTop: 6 }}>
                      <Plus size={16} /> Informar CEP
                    </span>
                  </>
                )}
              </span>
            </button>
            {attempted && addrMissing && (
              <p className={s.fieldError} style={{ marginTop: 8 }}>
                Informe o endereço de entrega para continuar.
              </p>
            )}
          </section>
        )}

        {/* envio */}
        {needsAddress && (
          <section className={s.section} aria-labelledby="sc-envio-t">
            <div className={s.sectionHead} style={{ marginBottom: 4 }}>
              <h2 className={s.sectionTitle} id="sc-envio-t" style={{ fontSize: 16 }}>
                Envio
              </h2>
              <Truck size={20} color="var(--sc-text-2)" aria-hidden />
            </div>
            <div className={s.optionList} role="radiogroup" aria-labelledby="sc-envio-t">
              <div className={s.option} role="radio" aria-checked="true" tabIndex={0} style={{ cursor: "default" }}>
                <span className={`${s.radio} ${s.on}`} />
                <span className={s.optionBody}>
                  <span className={s.optionTitle}>{shipLabel}</span>
                  <span className={s.optionSub} style={{ display: "block" }}>
                    {store.shipping.label} · Única opção disponível
                  </span>
                </span>
                <span className={`${s.optionRight} ${store.shipping.mode === "free" ? s.free : ""}`}>
                  {store.shipping.mode === "free" ? "Grátis" : brl(store.shipping.priceCents)}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* order bumps */}
        {bumps.length > 0 && (
          <section className={s.section} aria-labelledby="sc-bumps-t">
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle} id="sc-bumps-t">
                Aproveite também
              </h2>
            </div>
            <div className={s.optionList}>
              {bumps.map((b) => {
                const on = selectedBumps.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    className={s.option}
                    onClick={() => setSelectedBumps((p) => (on ? p.filter((x) => x !== b.id) : [...p, b.id]))}
                  >
                    <span className={`${s.check} ${on ? s.on : ""}`}>
                      {on ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </span>
                    <span className={s.optionBody}>
                      <span className={s.optionTitle} style={{ fontWeight: 500 }}>
                        {b.title}
                      </span>
                      <span className={s.optionSub} style={{ display: "block" }}>
                        {b.description}
                      </span>
                    </span>
                    <span className={s.optionRight}>+ {brl(b.priceCents)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* pagamento */}
        <section className={s.section} id="sc-pagamento" aria-labelledby="sc-pag-t">
          <div className={s.sectionHead} style={{ marginBottom: 4 }}>
            <h2 className={s.sectionTitle} id="sc-pag-t">
              Meios de pagamento
            </h2>
          </div>
          {enabledMethods.length === 0 ? (
            <div className={`${s.alert} ${s.alertError}`}>
              <AlertCircle size={18} />
              <span>Nenhum meio de pagamento disponível para este produto.</span>
            </div>
          ) : (
            <div className={s.optionList} role="radiogroup" aria-labelledby="sc-pag-t">
              {visibleMethods.map((m) => {
                const on = method === m.key;
                const isPix = m.key === "pix";
                return (
                  <button
                    key={m.key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-disabled={!m.available}
                    className={s.option}
                    style={{ padding: "14px 0" }}
                    onClick={() => m.available && setMethod(m.key)}
                  >
                    <span className={`${s.radio} ${on ? s.on : ""}`} />
                    <span className={s.methodIcon} aria-hidden>
                      {m.icon}
                    </span>
                    <span className={s.optionBody}>
                      {isPix && quote.pixDiscountCents > 0 && <span className={s.badgeDark}>Pague menos</span>}
                      <span className={s.optionTitle} style={{ display: "block" }}>
                        {m.label}
                      </span>
                      {isPix && quote.pixDiscountCents > 0 ? (
                        <span className={s.pillGreen}>
                          Economize <b>{brl(quote.pixDiscountCents)}</b>
                        </span>
                      ) : isPix ? (
                        <span className={s.optionSub} style={{ display: "block" }}>
                          Aprovação após a confirmação do banco
                        </span>
                      ) : (
                        <span className={s.optionSub} style={{ display: "block" }}>
                          Indisponível no momento
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {enabledMethods.length > 2 && (
            <button type="button" className={s.link} onClick={() => setShowAllMethods((v) => !v)} aria-expanded={showAllMethods}>
              {showAllMethods ? "Mostrar menos" : "Mostrar todos"}
              {showAllMethods ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </section>

        {/* faturamento */}
        {hasBilling && (
          <section className={s.section} id="sc-faturamento" aria-labelledby="sc-fat-t">
            <div className={s.sectionHead} style={{ marginBottom: 10 }}>
              <h2 className={s.sectionTitle} id="sc-fat-t">
                Faturamento
              </h2>
            </div>
            {billMissing && !billing.name && !billing.email ? (
              <p style={{ margin: "0 0 8px", color: "var(--sc-text-2)" }}>Informe seus dados para emitir o pedido.</p>
            ) : (
              <div style={{ marginBottom: 8, overflowWrap: "anywhere" }}>
                {[fields.nome && billing.name, fields.cpf && billing.cpf && `CPF ${cpfHint(billing.cpf)}`]
                  .filter(Boolean)
                  .join(" - ")}
                {fields.email && billing.email ? <div className={s.muted}>{billing.email}</div> : null}
              </div>
            )}
            <button
              type="button"
              className={s.link}
              onClick={() => {
                if (!billing.name && address?.recipient) setBilling((b) => ({ ...b, name: address.recipient }));
                setSheet("billing");
              }}
            >
              {billMissing && !billing.name && !billing.email ? (
                <>
                  <Plus size={16} /> Adicionar dados
                </>
              ) : (
                <>
                  <Pencil size={15} /> Alterar
                </>
              )}
            </button>
            {attempted && billMissing && (
              <p className={s.fieldError} style={{ marginTop: 6 }}>
                {Object.values(billErrors)[0]}
              </p>
            )}
          </section>
        )}

        {/* resumo */}
        <section className={s.section} ref={summaryRef} aria-labelledby="sc-resumo-t">
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle} id="sc-resumo-t">
              Resumo da compra
            </h2>
            {quoting && <Loader2 size={16} className={s.spin} color="var(--sc-text-2)" aria-label="Atualizando" />}
          </div>
          <div className={s.rows} aria-live="polite">
            <div className={s.row}>
              <span>Produto</span>
              <span>{brl(props.priceCents)}</span>
            </div>
            {bumps
              .filter((b) => selectedBumps.includes(b.id))
              .map((b) => (
                <div className={s.row} key={b.id}>
                  <span>{b.title}</span>
                  <span>{brl(b.priceCents)}</span>
                </div>
              ))}
            {needsAddress && (
              <div className={s.row}>
                <span>Frete</span>
                <span className={quote.shippingCents ? "" : s.free}>
                  {quote.shippingCents ? brl(quote.shippingCents) : "Grátis"}
                </span>
              </div>
            )}
            {quote.coupon && (
              <div className={`${s.row} ${s.rowGreen}`}>
                <span>Cupom {quote.coupon.code}</span>
                <span>− {brl(quote.couponDiscountCents)}</span>
              </div>
            )}
            {quote.pixDiscountCents > 0 && method === "pix" && (
              <div className={`${s.row} ${s.rowGreen}`}>
                <span>Desconto Pix ({quote.pixDiscountPercent}%)</span>
                <span>− {brl(quote.pixDiscountCents)}</span>
              </div>
            )}
            {quote.coupon ? (
              <div className={s.couponApplied}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Ticket size={16} /> Cupom <b>{quote.coupon.code}</b> aplicado
                </span>
                <button type="button" className={`${s.link} ${s.linkDanger}`} onClick={() => setCoupon(null)}>
                  Remover
                </button>
              </div>
            ) : (
              couponRow
            )}
            <div className={s.divider} />
            <div className={s.totalRow}>
              <span>Total</span>
              <Money cents={quote.totalCents} />
            </div>
          </div>
          <p className={s.muted} style={{ marginTop: 16, display: "flex", gap: 6, alignItems: "flex-start" }}>
            <Lock size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Pagamento processado com segurança. Ao finalizar, você concorda com os{" "}
              <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                termos
              </a>{" "}
              e a{" "}
              <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                política de privacidade
              </a>
              .
            </span>
          </p>
          {submitError && (
            <div className={`${s.alert} ${s.alertError}`} role="alert" style={{ marginTop: 14 }}>
              <AlertCircle size={18} />
              <span>{submitError}</span>
            </div>
          )}
        </section>
      </main>

      {/* barra fixa */}
      <div className={s.bar}>
        {!summaryVisible && couponRow && <div className={s.barCoupon}>{couponRow}</div>}
        <div className={s.barInner}>
          {!summaryVisible && (
            <button
              type="button"
              className={s.barTotal}
              onClick={() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              aria-label={`Total ${brl(quote.totalCents)}. Ver resumo da compra`}
            >
              <Money cents={quote.totalCents} />
              <ChevronUp size={20} />
            </button>
          )}
          <button type="button" className={s.btn} onClick={submit} disabled={submitting || enabledMethods.length === 0}>
            {submitting ? (
              <>
                <Loader2 size={18} className={s.spin} /> Gerando Pix...
              </>
            ) : (
              "Pagar e finalizar"
            )}
          </button>
        </div>
      </div>

      <AddressSheet
        open={sheet === "address"}
        onClose={() => setSheet(null)}
        addresses={addresses}
        selected={addrIndex}
        onSelect={setAddrIndex}
        onSave={(a, i) => {
          if (i === null) {
            setAddresses((list) => [...list, a]);
            setAddrIndex(addresses.length);
          } else {
            setAddresses((list) => list.map((x, j) => (j === i ? a : x)));
            setAddrIndex(i);
          }
          if (fields.nome && !billing.name) setBilling((b) => ({ ...b, name: a.recipient }));
          setSheet(null);
        }}
      />
      <BillingSheet
        open={sheet === "billing"}
        onClose={() => setSheet(null)}
        fields={fields}
        value={billing}
        onSave={(b) => {
          setBilling(b);
          setSheet(null);
        }}
      />
      <CouponSheet open={sheet === "coupon"} onClose={() => setSheet(null)} onApply={applyCoupon} />
    </StoreRoot>
  );
}
