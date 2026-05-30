"use client";

/**
 * /oauth-ads — página de retorno do OAuth de Ads (carrega DENTRO do popup).
 *
 * Depois do login no Google/Meta/etc., o navegador às vezes corta o
 * window.opener (COOP). Por isso avisamos a janela principal por TODOS
 * os canais possíveis (postMessage + BroadcastChannel + localStorage) e
 * SEMPRE tentamos fechar o popup. Só caímos pro painel se de fato não
 * for um popup (window.close não fechou).
 */

import { useEffect, useState } from "react";

export default function OauthAdsReturn() {
  const [msg, setMsg] = useState("Conectando…");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const connected = q.get("connected");
    const error = q.get("error");
    const payload = { type: "ads-oauth", connected, error };

    // 1) Avisa a janela principal por todos os canais
    try {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage(payload, window.location.origin);
      }
    } catch {
      /* opener cortado por COOP — segue pros outros canais */
    }
    try {
      const bc = new BroadcastChannel("shadowpay-ads");
      bc.postMessage(payload);
      bc.close();
    } catch {
      /* navegador sem BroadcastChannel */
    }
    try {
      localStorage.setItem(
        "shadowpay-ads-oauth",
        JSON.stringify({ ...payload, t: Date.now() })
      );
    } catch {
      /* ignore */
    }

    setMsg(error ? "Falha na conexão. Fechando…" : "Conta conectada! Fechando…");

    // 2) Sempre tenta fechar o popup
    const t1 = setTimeout(() => {
      window.close();
      // 3) Se NÃO fechou (não era popup de verdade), aí volta pro painel
      const t2 = setTimeout(() => {
        if (!window.closed) {
          const params = new URLSearchParams();
          params.set("tab", "ads");
          if (connected) params.set("connected", connected);
          if (error) params.set("error", error);
          window.location.replace(`/v1/tracking?${params.toString()}`);
        }
      }, 500);
      return () => clearTimeout(t2);
    }, 250);

    return () => clearTimeout(t1);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 14,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        background: "#FFFFFF",
        color: "#0F172A",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid rgba(124,58,237,0.20)",
          borderTopColor: "#7C3AED",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontSize: 14, fontWeight: 600 }}>{msg}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
