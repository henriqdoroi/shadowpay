"use client";

/**
 * /oauth-ads — página de retorno do OAuth de Ads.
 *
 * O backend redireciona o POPUP pra cá com ?connected= ou ?error=.
 * Aqui a gente avisa a janela principal (postMessage) e fecha o popup.
 * Se não for popup (sem opener), cai de volta no /v1/tracking?tab=ads.
 */

import { useEffect, useState } from "react";

export default function OauthAdsReturn() {
  const [msg, setMsg] = useState("Conectando…");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const connected = q.get("connected");
    const error = q.get("error");

    const isPopup = !!window.opener && window.opener !== window;

    if (isPopup) {
      try {
        window.opener.postMessage(
          { type: "ads-oauth", connected, error },
          window.location.origin
        );
      } catch {
        // ignore
      }
      setMsg(
        error
          ? "Falha na conexão. Pode fechar esta janela."
          : "Conta conectada! Fechando…"
      );
      setTimeout(() => window.close(), 600);
    } else {
      // Não é popup — volta pro painel com os params
      const params = new URLSearchParams();
      params.set("tab", "ads");
      if (connected) params.set("connected", connected);
      if (error) params.set("error", error);
      window.location.replace(`/v1/tracking?${params.toString()}`);
    }
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
