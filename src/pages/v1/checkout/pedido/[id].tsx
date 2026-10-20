/**
 * Página do pedido (link público do comprador): status real do pagamento,
 * itens, total e previsão de entrega. Sem dados pessoais — o servidor só
 * devolve cidade/UF da entrega.
 */
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AlertCircle, CheckCircle2, Clock, Loader2, MapPin, Package, RefreshCw, XCircle } from "lucide-react";
import { FAILED, PAID, brl, deliveryWindow } from "@/components/store-checkout/lib";
import { Money, StoreHeader, StoreRoot, s } from "@/components/store-checkout/ui";
import { useOrder } from "@/components/store-checkout/useOrder";

const DEFAULT_BRAND = "#2968c8";

export default function OrderPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : null;
  const { order, error, offline, reload } = useOrder(id);
  const brand = order?.store?.headerColor || DEFAULT_BRAND;

  const head = (
    <Head>
      <title>Meu pedido</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="robots" content="noindex" />
    </Head>
  );

  if (!order) {
    return (
      <StoreRoot brand={brand}>
        {head}
        <StoreHeader title="Meu pedido" onBack={null} />
        <div className={s.state} role="status">
          {error ? (
            <>
              <AlertCircle size={32} color="var(--sc-red)" />
              <p style={{ margin: 0, color: "var(--sc-text)" }}>{error}</p>
            </>
          ) : offline ? (
            <>
              <AlertCircle size={32} />
              <p style={{ margin: 0 }}>Sem conexão. Verifique sua internet.</p>
              <button type="button" className={s.link} onClick={() => reload()}>
                <RefreshCw size={16} /> Tentar de novo
              </button>
            </>
          ) : (
            <>
              <Loader2 size={28} className={s.spin} />
              <p style={{ margin: 0 }}>Carregando pedido...</p>
            </>
          )}
        </div>
      </StoreRoot>
    );
  }

  const paid = PAID(order.status);
  const failed = FAILED(order.status) || (!paid && !!order.expiresAt && new Date(order.expiresAt).getTime() < Date.now());
  const pixHref = `/v1/checkout/pix/${encodeURIComponent(order.id)}`;
  const totalCents = Math.round(order.amount * 100);
  const created = order.createdAt ? new Date(order.createdAt) : null;
  const goods = order.items.filter((i) => i.kind !== "shipping");
  const ship = order.items.find((i) => i.kind === "shipping");

  const status = paid
    ? { cls: s.stPaid, icon: <CheckCircle2 size={15} />, text: "Pagamento aprovado" }
    : failed
      ? { cls: s.stFail, icon: <XCircle size={15} />, text: order.status === "refunded" ? "Reembolsado" : "Não pago" }
      : { cls: s.stPending, icon: <Clock size={15} />, text: "Aguardando pagamento" };

  return (
    <StoreRoot brand={brand}>
      {head}
      <StoreHeader
        title="Meu pedido"
        onBack={!paid && !failed ? () => router.push(pixHref) : null}
      />
      <main className={s.main} style={{ paddingBottom: 32 }}>
        <section className={s.section}>
          <div className={s.sectionHead} style={{ marginBottom: 8, flexWrap: "wrap" }}>
            <h2 className={s.sectionTitle}>Pedido #{order.id.slice(0, 8).toUpperCase()}</h2>
            <span className={`${s.statusPill} ${status.cls}`} role="status">
              {status.icon}
              {status.text}
            </span>
          </div>
          {created && (
            <p className={s.muted} style={{ margin: 0 }}>
              Feito em {created.toLocaleDateString("pt-BR")} às{" "}
              {created.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {!paid && !failed && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <a className={s.btn} href={pixHref} style={{ textDecoration: "none" }}>
                Pagar {brl(totalCents)} com Pix
              </a>
              <p className={s.muted} style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <Loader2 size={13} className={s.spin} /> Esta página atualiza sozinha quando o pagamento for confirmado.
              </p>
            </div>
          )}
          {failed && order.productId && (
            <div style={{ marginTop: 16 }}>
              <a className={s.btn} href={`/v1/checkout/${encodeURIComponent(order.productId)}`} style={{ textDecoration: "none" }}>
                Comprar novamente
              </a>
            </div>
          )}
        </section>

        {order.delivery && (
          <section className={s.section}>
            <div className={s.sectionHead} style={{ marginBottom: 8 }}>
              <h2 className={s.sectionTitle} style={{ fontSize: 16 }}>
                Entrega
              </h2>
            </div>
            <p className={s.inline} style={{ margin: 0 }}>
              <MapPin size={18} color="var(--sc-primary)" />
              <span>
                {order.delivery.city}/{order.delivery.state}
              </span>
            </p>
            <p className={s.muted} style={{ margin: "6px 0 0" }}>
              {paid && order.delivery.daysMin != null && order.delivery.daysMax != null
                ? `${deliveryWindow(order.delivery.daysMin, order.delivery.daysMax, order.paidAt ? new Date(order.paidAt) : new Date())} (previsão)`
                : "A previsão de entrega é confirmada depois que o pagamento for aprovado."}
            </p>
          </section>
        )}

        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle} style={{ fontSize: 16 }}>
              Itens
            </h2>
          </div>
          <div className={s.rows}>
            {goods.length ? (
              goods.map((i, k) => (
                <div className={s.row} key={k}>
                  <span style={{ display: "inline-flex", gap: 8, alignItems: "flex-start" }}>
                    <Package size={16} style={{ flexShrink: 0, marginTop: 2 }} color="var(--sc-text-2)" />
                    {i.quantity > 1 ? `${i.quantity}× ` : ""}
                    {i.name}
                  </span>
                  <span>{brl(i.priceCents * i.quantity)}</span>
                </div>
              ))
            ) : (
              <div className={s.row}>
                <span>{order.productName || "Produto"}</span>
                <span>{brl(totalCents)}</span>
              </div>
            )}
            {ship && (
              <div className={s.row}>
                <span>Frete</span>
                <span>{brl(ship.priceCents)}</span>
              </div>
            )}
            {order.delivery && !ship && (
              <div className={s.row}>
                <span>Frete</span>
                <span className={s.free}>Grátis</span>
              </div>
            )}
            <div className={s.divider} />
            <div className={s.totalRow}>
              <span>Total</span>
              <Money cents={totalCents} />
            </div>
            <p className={s.muted} style={{ margin: 0 }}>Valores já com descontos aplicados.</p>
          </div>
        </section>
      </main>
    </StoreRoot>
  );
}
