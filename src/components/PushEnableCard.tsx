"use client";

/**
 * PushEnableCard — card violeta que aparece no topo da página de
 * notificações pedindo pro seller ativar o push do navegador/PWA.
 *
 *  - Esconde quando já está subscribed.
 *  - Mostra estado "denied" se o user bloqueou.
 *  - Tem botão "Enviar teste" quando ativado, pro seller confirmar.
 */
import { useAuth } from "@/contexts/AuthContext";
import { usePush } from "@/hooks/usePush";
import { BellRing, Check, X, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const T = {
  primary: "#7C3AED",
  primarySoft: "rgba(124,58,237,0.10)",
  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.10)",
  red: "#EF4444",
  redSoft: "rgba(239,68,68,0.10)",
  border: "rgba(15,23,42,0.08)",
};

export function PushEnableCard() {
  const { token } = useAuth();
  const { status, supported, subscribe, unsubscribe, sendTest } = usePush(token);
  const [loading, setLoading] = useState(false);

  if (!supported || status === "unsupported") {
    return (
      <div
        className="mb-5 flex items-start gap-3 rounded-2xl p-4"
        style={{
          background: "rgba(15,23,42,0.04)",
          border: `1px solid ${T.border}`,
        }}
      >
        <Smartphone className="mt-0.5 h-5 w-5 text-slate-500" />
        <div className="flex-1">
          <p className="text-[13px] font-bold text-slate-700">
            Este dispositivo não suporta notificações push
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            No iPhone, instale a ShadowPay como app (Compartilhar →
            "Adicionar à Tela de Início") e ative as notificações por lá.
            No Android e desktop, use Chrome, Edge ou Firefox.
          </p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div
        className="mb-5 flex items-start gap-3 rounded-2xl p-4"
        style={{ background: T.redSoft, border: `1px solid ${T.border}` }}
      >
        <X className="mt-0.5 h-5 w-5" style={{ color: T.red }} />
        <div className="flex-1">
          <p className="text-[13px] font-bold text-slate-800">
            Notificações bloqueadas no navegador
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            Você bloqueou as notificações da ShadowPay. Reabra as permissões
            do site nas configurações do navegador para receber alertas.
          </p>
        </div>
      </div>
    );
  }

  if (status === "subscribed") {
    return (
      <div
        className="mb-5 flex items-start gap-3 rounded-2xl p-4"
        style={{ background: T.greenSoft, border: `1px solid ${T.border}` }}
      >
        <Check className="mt-0.5 h-5 w-5" style={{ color: T.green }} />
        <div className="flex-1">
          <p className="text-[13px] font-bold text-slate-800">
            Notificações ativadas neste dispositivo
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            Quando o cliente gerar um PIX você recebe na hora; quando ele
            pagar, vem outro alerta. Tudo direto no celular ou desktop.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            onClick={async () => {
              setLoading(true);
              const ok = await sendTest();
              setLoading(false);
              if (ok) toast.success("Notificação de teste enviada!");
              else toast.error("Falha ao enviar teste — tente reativar.");
            }}
            disabled={loading}
            className="inline-flex h-8 items-center justify-center rounded-lg border bg-white px-3 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            style={{ borderColor: T.border }}
          >
            {loading ? "Enviando…" : "Enviar teste"}
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              await unsubscribe();
              setLoading(false);
              toast.success("Notificações desativadas.");
            }}
            disabled={loading}
            className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-[11.5px] font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Desativar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mb-5 flex flex-col items-start gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
      style={{
        background: T.primarySoft,
        border: `1px solid ${T.border}`,
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: T.primary, color: "#FFFFFF" }}
      >
        <BellRing className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-bold text-slate-900">
          Ative as notificações no celular
        </p>
        <p className="mt-0.5 text-[12px] text-slate-600">
          Receba <b>venda pendente</b> quando o cliente gerar o PIX, e{" "}
          <b>venda aprovada</b> no momento exato em que ele pagar — direto na
          tela bloqueada do celular, sem delay.
        </p>
      </div>
      <button
        onClick={async () => {
          setLoading(true);
          const ok = await subscribe();
          setLoading(false);
          if (ok) toast.success("Notificações ativadas!");
          else toast.error("Não foi possível ativar. Verifique a permissão.");
        }}
        disabled={loading}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        style={{
          background: T.primary,
          boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
        }}
      >
        {loading ? "Ativando…" : "Ativar agora"}
      </button>
    </div>
  );
}
