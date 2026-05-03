// src/checkout/trackeamento.tsx
import React, { useEffect } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";

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

// 🔹 Espera o UTMify carregar antes de disparar, com timeout de 5s
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

// 🔹 Evento UTMify
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

// 🔹 Evento Facebook Pixel
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

// 🔹 Função única para eventos de conversão
export const trackConversionEvent = async (
  sale: any,
  eventType: "purchase" | "CPA" | "CPC" | "CTR" | "CPM" | "IC",
  utmParams: Record<string, string> = {}
) => {
  const eventData: TrackEventData = {
    value: sale.totalPrice || sale.amount || 0,
    currency: "BRL",
    content_ids: [sale.id],
    content_type: "product",
    ...utmParams,
  };

  try {
    trackFacebookPixelEvent(eventType, eventData);
    await trackUTMifyEvent(eventType.toLowerCase(), eventData);
  } catch (err) {
    console.error("Erro ao disparar eventos:", err);
  }

  // Log opcional no backend
  fetch("/api/track-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: eventType, eventData }),
  }).catch((err) => console.error("Erro ao enviar evento para backend:", err));
};

// 🔹 Componente de Trackeamento (só client-side)
const TrackeamentoPage: React.FC = () => {
  useEffect(() => {
    const dummySale = { id: "12345", totalPrice: 99.9 };
    const utmParams = { source: "newsletter" };
    trackConversionEvent(dummySale, "purchase", utmParams);
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Trackeamento de Compra</h1>
      <p>Eventos de tracking estão sendo disparados.</p>

      {/* 🔹 Meta Pixel Script */}
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
        />
      </noscript>
    </div>
  );
};

// 🔹 Export com dynamic para rodar só no client
export default dynamic(() => Promise.resolve(TrackeamentoPage), { ssr: false });
