// src/pages/v1/checkout/trackeamento.tsx
//
// Página REAL de trackeamento. Não dispara mais nenhum `dummySale`.
//
// Como funciona:
//  - Sem ?txId / ?productId → só monta o Pixel + UTMify e fica em pé,
//    pronta pra receber. Não dispara nenhum evento.
//  - Com ?txId=xxx → busca a venda real em /api/sales/public/:id,
//    dispara Purchase com `value` real e atualiza UTMify/Pixel.
//
// Eventos exportados (trackUTMifyEvent, trackFacebookPixelEvent,
// trackConversionEvent) também batem no backend em /api/tracking/event
// pra persistir no DB.
import React, { useEffect, useState } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const API = "https://shadowpay-api-production.up.railway.app";

interface TrackEventData {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_type?: string;
  [key: string]: any;
}

declare global {
  interface Window {
    utmify?: {
      track: (eventName: string, data?: Record<string, any>) => void;
    };
    fbq?: (...args: any[]) => void;
  }
}

const waitForUtmify = (): Promise<void> =>
  new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (window.utmify) resolve();
      else if (attempts > 50) reject("UTMify não carregou em 5s");
      else setTimeout(check, 100);
    };
    check();
  });

export const trackUTMifyEvent = async (
  eventName: string,
  data: TrackEventData
) => {
  if (typeof window === "undefined") return;
  try {
    await waitForUtmify();
    window.utmify?.track(eventName, data);
  } catch (err) {
    console.warn("Erro ao disparar evento UTMify:", err);
  }
};

export const trackFacebookPixelEvent = (
  eventName: string,
  data: TrackEventData
) => {
  if (typeof window !== "undefined" && window.fbq) {
    try {
      window.fbq("track", eventName, data);
    } catch (err) {
      console.warn("Erro ao disparar evento FB Pixel:", err);
    }
  }
};

/**
 * Dispara o evento em TODOS os canais (Pixel + UTMify + backend).
 * Sem nenhum fallback dummy. Se `sale` não existir, não dispara.
 */
export const trackConversionEvent = async (
  sale:
    | {
        id: string;
        transactionId?: string;
        amount?: number;
        totalPrice?: number;
        productId?: string;
        sellerId?: string;
      }
    | null,
  eventType:
    | "purchase"
    | "Purchase"
    | "InitiateCheckout"
    | "AddPaymentInfo"
    | "Lead"
    | "ViewContent"
    | "CPA"
    | "CPC"
    | "CTR"
    | "CPM"
    | "IC",
  utmParams: Record<string, string | null | undefined> = {}
) => {
  if (!sale || (!sale.id && !sale.transactionId)) {
    console.warn("[tracking] sem sale real, não disparando evento.");
    return;
  }

  const transactionId = sale.transactionId || sale.id;
  const value = sale.totalPrice ?? sale.amount ?? 0;

  const eventData: TrackEventData = {
    value,
    currency: "BRL",
    content_ids: [transactionId],
    content_type: "product",
    ...utmParams,
  };

  try {
    trackFacebookPixelEvent(eventType, eventData);
    await trackUTMifyEvent(String(eventType).toLowerCase(), eventData);
  } catch (err) {
    console.error("Erro ao disparar eventos client-side:", err);
  }

  // Persiste no backend (canal real, indexado por sellerId + utm)
  try {
    await fetch(`${API}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: String(eventType),
        transactionId,
        productId: sale.productId,
        sellerId: sale.sellerId,
        value,
        currency: "BRL",
        utm_source: utmParams.utm_source ?? null,
        utm_medium: utmParams.utm_medium ?? null,
        utm_campaign: utmParams.utm_campaign ?? null,
        utm_content: utmParams.utm_content ?? null,
        utm_term: utmParams.utm_term ?? null,
        fbclid: utmParams.fbclid ?? null,
        payload: eventData,
      }),
    });
  } catch (err) {
    console.warn("Erro ao enviar evento de tracking ao backend:", err);
  }
};

/* ------------------------------------------------------------------
 * Página visível em /v1/checkout/trackeamento
 *
 * Comportamento:
 *   - Lê ?txId, ?productId, ?utm_* na URL.
 *   - Se ?txId presente: chama /api/sales/public/:id, dispara Purchase.
 *   - Se ausente: NÃO dispara nada. Apenas mostra "aguardando venda".
 * ------------------------------------------------------------------ */
const TrackeamentoPage: React.FC = () => {
  const router = useRouter();
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "fired"; tx: any }
    | { kind: "error"; msg: string }
  >({ kind: "idle" });

  useEffect(() => {
    if (!router.isReady) return;
    const { txId, productId, ...rest } = router.query as Record<string, string>;

    if (!txId) {
      setState({ kind: "idle" });
      return;
    }

    setState({ kind: "loading" });
    (async () => {
      try {
        const r = await fetch(`${API}/api/sales/public/${txId}`);
        const j = await r.json();
        if (!j?.success || !j?.data) {
          setState({
            kind: "error",
            msg: "Venda não encontrada — nenhum evento disparado.",
          });
          return;
        }
        const tx = j.data;

        // Só dispara Purchase se a venda foi de fato aprovada
        if (String(tx.status).toLowerCase() !== "approved") {
          setState({
            kind: "error",
            msg: `Venda ${txId} ainda não aprovada (status: ${tx.status}). Nada disparado.`,
          });
          return;
        }

        await trackConversionEvent(
          {
            id: tx.id,
            transactionId: tx.id,
            amount: Number(tx.amount ?? tx.grossAmount ?? 0),
            productId: productId || tx.productId,
            sellerId: tx.sellerId,
          },
          "Purchase",
          {
            utm_source: rest.utm_source,
            utm_medium: rest.utm_medium,
            utm_campaign: rest.utm_campaign,
            utm_content: rest.utm_content,
            utm_term: rest.utm_term,
            fbclid: rest.fbclid,
          }
        );
        setState({ kind: "fired", tx });
      } catch (e: any) {
        setState({ kind: "error", msg: e?.message || "Erro ao rastrear." });
      }
    })();
  }, [router.isReady, router.query]);

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
        Trackeamento ShadowPay
      </h1>
      <p style={{ marginTop: 8, color: "#64748B", fontSize: 14 }}>
        {state.kind === "idle" &&
          "Página pronta. Passe ?txId=<id-da-venda> para disparar Purchase."}
        {state.kind === "loading" && "Buscando venda e disparando eventos…"}
        {state.kind === "fired" &&
          `Evento Purchase disparado para venda ${state.tx.id} — R$ ${Number(
            state.tx.amount ?? 0
          ).toFixed(2)}.`}
        {state.kind === "error" && state.msg}
      </p>

      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '670782038702837');
            fbq('track', 'PageView');
          `,
        }}
        onError={(e) => console.error("Erro ao carregar FB Pixel", e)}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=670782038702837&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </div>
  );
};

export default dynamic(() => Promise.resolve(TrackeamentoPage), { ssr: false });
