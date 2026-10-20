/**
 * Tela do PIX do checkout loja: valor e código "copia e cola" DA COBRANÇA
 * REAL (criada no PSP pelo servidor). O status só muda quando o servidor
 * confirma o pagamento (webhook/consulta ao PSP).
 *
 * /v1/checkout/pix/demo = modo demonstração: dados de exemplo, sem código
 * pagável e com o botão de copiar desligado.
 */
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Info,
  Loader2,
  MoreHorizontal,
  QrCode,
  RefreshCw,
  X,
} from "lucide-react";
import { FAILED, Order, PAID, brl } from "@/components/store-checkout/lib";
import { StoreRoot, s } from "@/components/store-checkout/ui";
import { fmtLeft, useCountdown, useOrder } from "@/components/store-checkout/useOrder";

const DEFAULT_BRAND = "#2968c8";

const DEMO: Order = {
  id: "demo",
  status: "pending",
  qrCode: "EXEMPLO-DE-DEMONSTRACAO-ESTE-TEXTO-NAO-E-UM-CODIGO-PIX-E-NAO-PODE-SER-PAGO",
  qrCodeImage: null,
  amount: 449.1,
  paidAt: null,
  productId: null,
  productName: "Produto de exemplo",
  createdAt: null,
  expiresAt: null,
  items: [],
  delivery: { city: "Cidade", state: "UF", daysMin: 3, daysMax: 7 },
  store: null,
  linkUpSell: null,
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // navegador sem Clipboard API (ou sem permissão): seleção + execCommand
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function safeUrl(v: string | null): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export default function PixPaymentPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : null;
  const demo = id === "demo";
  const live = useOrder(demo ? null : id);
  const order = demo ? DEMO : live.order;

  const left = useCountdown(order?.expiresAt);
  const paid = !!order && PAID(order.status);
  const expired = !!order && !paid && (FAILED(order.status) || left === 0);

  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showQr, setShowQr] = useState(false);
  useEffect(() => {
    // tela grande: o QR Code é o jeito mais prático (celular escaneia)
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) setShowQr(true);
  }, []);

  const orderHref = id ? `/v1/checkout/pedido/${encodeURIComponent(id)}` : "/";
  const brand = order?.store?.headerColor || DEFAULT_BRAND;

  // pago: segue pro upsell do produto (se houver) depois de alguns segundos
  const upsell = useMemo(() => safeUrl(order?.linkUpSell ?? null), [order?.linkUpSell]);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  useEffect(() => {
    if (!paid || !upsell) return;
    setRedirectIn(6);
    const t = setInterval(() => {
      setRedirectIn((n) => {
        if (n === null) return n;
        if (n <= 1) {
          clearInterval(t);
          window.location.assign(upsell);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [paid, upsell]);

  const onCopy = async () => {
    if (demo || !order?.qrCode) return;
    const ok = await copyText(order.qrCode);
    setCopyFailed(!ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else setShowCode(true);
  };

  const head = (
    <Head>
      <title>{paid ? "Pagamento confirmado" : "Pagar com Pix"}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#ededed" />
      <meta name="robots" content="noindex" />
    </Head>
  );

  /* ---------- carregando / erro ---------- */
  if (!order) {
    return (
      <StoreRoot brand={brand} gray>
        {head}
        <div className={s.state} role="status">
          {live.error ? (
            <>
              <AlertCircle size={32} color="var(--sc-red)" />
              <p style={{ margin: 0, color: "var(--sc-text)" }}>{live.error}</p>
              <button type="button" className={s.link} onClick={() => router.back()}>
                Voltar
              </button>
            </>
          ) : live.offline ? (
            <>
              <AlertCircle size={32} />
              <p style={{ margin: 0 }}>Sem conexão. Verifique sua internet.</p>
              <button type="button" className={s.link} onClick={() => live.reload()}>
                <RefreshCw size={16} /> Tentar de novo
              </button>
            </>
          ) : (
            <>
              <Loader2 size={28} className={s.spin} />
              <p style={{ margin: 0 }}>Carregando seu Pix...</p>
            </>
          )}
        </div>
      </StoreRoot>
    );
  }

  const amount = brl(Math.round(order.amount * 100));
  const deliveryNote = order.delivery
    ? "Confirmaremos a data de entrega quando o pagamento for aprovado."
    : "Você recebe a confirmação e o acesso quando o pagamento for aprovado.";

  return (
    <StoreRoot brand={brand} gray>
      {head}
      {demo && (
        <div className={s.demoBanner} role="note">
          Modo demonstração · dados de exemplo, não é possível pagar
        </div>
      )}
      <div className={s.pixWrap}>
        <div className={s.pixTop}>
          <button
            type="button"
            className={s.iconBtn}
            aria-label="Fechar e ver meu pedido"
            onClick={() => (demo ? router.back() : router.push(orderHref))}
          >
            <X size={26} strokeWidth={1.5} />
          </button>
        </div>

        {/* cartão principal */}
        <div className={s.hero}>
          <div
            className={s.heroIcon}
            aria-hidden
            style={expired ? { borderColor: "var(--sc-text-3)", color: "var(--sc-text-2)" } : undefined}
          >
            {paid ? <CheckCircle2 size={40} /> : expired ? <Clock size={38} /> : <Banknote size={40} strokeWidth={1.75} />}
            {!paid && !expired && (
              <span className={s.heroDot}>
                <MoreHorizontal size={16} strokeWidth={3} />
              </span>
            )}
          </div>
          {paid ? (
            <>
              <p className={s.heroKicker}>Pagamento confirmado</p>
              <h1 className={s.heroTitle}>Recebemos seu pagamento de {amount}</h1>
            </>
          ) : expired ? (
            <>
              <p className={s.heroKicker}>Tempo esgotado</p>
              <h1 className={s.heroTitle}>Este Pix não está mais disponível</h1>
            </>
          ) : (
            <>
              <p className={s.heroKicker}>Falta pouco!</p>
              <h1 className={s.heroTitle}>Pague {amount} via Pix para concluir sua compra</h1>
            </>
          )}
        </div>

        {paid ? (
          <div className={s.card}>
            <div className={s.cardBody}>
              <p className={s.inline} style={{ margin: 0 }}>
                <CheckCircle2 size={20} color="var(--sc-green)" />
                {order.productName ? `Pedido de ${order.productName} aprovado.` : "Seu pedido foi aprovado."}
              </p>
              <div className={s.alert}>
                <Info size={18} />
                <span>
                  {order.delivery
                    ? "Agora o vendedor prepara o envio. A previsão de entrega aparece no seu pedido."
                    : "Os detalhes da compra foram enviados para o e-mail informado."}
                </span>
              </div>
              <a className={`${s.btn} ${s.btnSuccess}`} href={orderHref} style={{ textDecoration: "none" }}>
                Ver meu pedido
              </a>
              {upsell && redirectIn !== null && (
                <p className={s.muted} style={{ margin: 0, textAlign: "center" }}>
                  Você será redirecionado em {redirectIn}s...{" "}
                  <a href={upsell} className={s.link} style={{ fontSize: 13 }}>
                    Ir agora
                  </a>
                </p>
              )}
            </div>
          </div>
        ) : expired ? (
          <div className={s.card}>
            <div className={s.cardBody}>
              <p style={{ margin: 0 }}>
                O prazo para pagar este código acabou. Se você já pagou, aguarde: a confirmação aparece no seu pedido
                assim que o banco processar.
              </p>
              {order.productId ? (
                <a
                  className={s.btn}
                  href={`/v1/checkout/${encodeURIComponent(order.productId)}`}
                  style={{ textDecoration: "none" }}
                >
                  Gerar novo Pix
                </a>
              ) : null}
              <div className={s.center}>
                <a className={s.link} href={orderHref}>
                  Ver meu pedido
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className={s.card}>
            <div className={s.cardHead}>
              <h2 className={s.cardTitle}>Instruções de pagamento</h2>
            </div>
            <div className={s.cardBody}>
              <ol className={s.steps}>
                <li>Acesse seu Internet Banking ou app de pagamentos.</li>
                <li>Escolha pagar via Pix.</li>
                <li>{showQr ? "Escaneie o QR Code ou cole o código abaixo." : "Cole o código abaixo."}</li>
              </ol>

              {showQr &&
                (demo ? (
                  <div className={s.qrBox} style={{ width: 226, height: 226, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1.3, textAlign: "center", color: "var(--sc-text-2)", fontSize: 13 }}>
                    QR Code indisponível na demonstração
                  </div>
                ) : order.qrCode ? (
                  <div className={s.qrBox}>
                    <QRCodeSVG value={order.qrCode} size={200} level="M" includeMargin={false} aria-label="QR Code do Pix" />
                  </div>
                ) : null)}

              {order.qrCode ? (
                <div
                  className={`${s.code} ${showCode ? s.open : ""}`}
                  onClick={() => setShowCode(true)}
                  aria-label="Código Pix copia e cola"
                >
                  {order.qrCode}
                </div>
              ) : (
                <div className={`${s.alert} ${s.alertError}`}>
                  <AlertCircle size={18} />
                  <span>O código deste Pix não está disponível. Gere um novo pagamento.</span>
                </div>
              )}

              <p className={s.inline} style={{ margin: 0 }}>
                <Clock size={18} />
                <span>
                  {left !== null ? (
                    <>
                      Pague em até <b style={{ fontVariantNumeric: "tabular-nums" }}>{fmtLeft(left)}</b>. A confirmação
                      é automática.
                    </>
                  ) : (
                    "Assim que o banco confirmar o pagamento, sua compra é aprovada."
                  )}
                </span>
              </p>

              <div className={s.alert}>
                <Info size={18} />
                <span>{deliveryNote}</span>
              </div>

              {copyFailed && (
                <p className={s.fieldError} style={{ margin: 0 }}>
                  Não deu para copiar automaticamente. Toque no código acima, selecione e copie.
                </p>
              )}

              <button
                type="button"
                className={`${s.btn} ${copied ? s.btnSuccess : ""}`}
                onClick={onCopy}
                disabled={demo || !order.qrCode}
                aria-live="polite"
              >
                {copied ? (
                  <>
                    <Check size={18} /> Código copiado!
                  </>
                ) : (
                  <>
                    <Copy size={18} /> {demo ? "Copiar código (desativado)" : "Copiar código"}
                  </>
                )}
              </button>
              {!showQr && order.qrCode && (
                <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => setShowQr(true)}>
                  <QrCode size={18} /> Mostrar QR Code
                </button>
              )}

              {!demo && (
                <p className={s.inline} style={{ margin: 0, justifyContent: "center", color: "var(--sc-text-2)", fontSize: 13 }} role="status">
                  <Loader2 size={14} className={s.spin} />
                  {live.offline ? "Sem conexão — tentando de novo..." : "Aguardando confirmação do pagamento"}
                </p>
              )}

              <div className={s.center}>
                {demo ? (
                  <span className={s.muted}>Página do pedido indisponível na demonstração</span>
                ) : (
                  <a className={s.link} href={orderHref}>
                    Ir para meu pedido
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {copied && (
        <div className={s.toast} role="status">
          <Check size={16} /> Código Pix copiado
        </div>
      )}
    </StoreRoot>
  );
}
