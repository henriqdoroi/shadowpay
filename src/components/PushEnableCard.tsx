"use client";

/**
 * PushEnableCard — card pra o seller ativar o push do navegador/PWA, com
 * diagnóstico visível (permissão + quantos dispositivos o servidor tem
 * registrado), pra facilitar achar problemas (principalmente no iPhone).
 */
import { useAuth } from "@/contexts/AuthContext";
import { usePush } from "@/hooks/usePush";
import { BellRing, Check, X, Smartphone, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const API = "https://shadowpay-backend.onrender.com";

const T = {
  primary: "#7C3AED",
  primarySoft: "rgba(124,58,237,0.10)",
  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.10)",
  red: "#EF4444",
  redSoft: "rgba(239,68,68,0.10)",
  amber: "#F59E0B",
  amberSoft: "rgba(245,158,11,0.10)",
  border: "rgba(15,23,42,0.08)",
};

export function PushEnableCard() {
  const { token } = useAuth();
  const { status, supported, subscribe, unsubscribe, sendTest } = usePush(token);
  const [loading, setLoading] = useState(false);
  const [serverCount, setServerCount] = useState<number | null>(null);
  const [perm, setPerm] = useState<string>("");

  async function refreshStatus() {
    try {
      if (typeof Notification !== "undefined") setPerm(Notification.permission);
    } catch {
      /* ignora */
    }
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/user/push/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (j?.success) setServerCount(Number(j.count) || 0);
    } catch {
      /* ignora */
    }
  }
  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status]);

  let card: React.ReactNode;

  if (!supported || status === "unsupported") {
    card = (
      <div
        className="flex items-start gap-3 rounded-2xl p-4"
        style={{ background: "rgba(15,23,42,0.04)", border: `1px solid ${T.border}` }}
      >
        <Smartphone className="mt-0.5 h-5 w-5 text-slate-500" />
        <div className="flex-1">
          <p className="text-[13px] font-bold text-slate-700">
            Este dispositivo não suporta notificações push
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            No iPhone, precisa de <b>iOS 16.4+</b> e instalar a ShadowPay como
            app (Compartilhar → "Adicionar à Tela de Início") — e abrir pelo
            ícone, não pelo Safari. No Android/desktop, use Chrome, Edge ou
            Firefox.
          </p>
        </div>
      </div>
    );
  } else if (status === "denied") {
    card = (
      <div
        className="flex items-start gap-3 rounded-2xl p-4"
        style={{ background: T.redSoft, border: `1px solid ${T.border}` }}
      >
        <X className="mt-0.5 h-5 w-5" style={{ color: T.red }} />
        <div className="flex-1">
          <p className="text-[13px] font-bold text-slate-800">
            Notificações bloqueadas
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            Você bloqueou as notificações. Reabra as permissões do site/app nas
            configurações e tente de novo.
          </p>
        </div>
      </div>
    );
  } else if (status === "error") {
    card = (
      <div
        className="flex flex-col items-start gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
        style={{ background: T.amberSoft, border: `1px solid ${T.border}` }}
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: T.amber }} />
        <div className="flex-1">
          <p className="text-[13px] font-bold text-slate-800">
            Não consegui concluir a ativação
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-600">
            A permissão pode ter sido dada, mas a inscrição não finalizou.
            Toque pra tentar de novo (no iPhone, com o app aberto pelo ícone).
          </p>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            const ok = await subscribe();
            setLoading(false);
            await refreshStatus();
            if (ok) toast.success("Notificações ativadas!");
            else toast.error("Ainda não deu. Veja o diagnóstico abaixo.");
          }}
          disabled={loading}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-[12.5px] font-bold text-white disabled:opacity-50"
          style={{ background: T.primary }}
        >
          {loading ? "Tentando…" : "Tentar de novo"}
        </button>
      </div>
    );
  } else if (status === "subscribed") {
    card = (
      <div
        className="flex items-start gap-3 rounded-2xl p-4"
        style={{ background: T.greenSoft, border: `1px solid ${T.border}` }}
      >
        <Check className="mt-0.5 h-5 w-5" style={{ color: T.green }} />
        <div className="flex-1">
          <p className="text-[13px] font-bold text-slate-800">
            Notificações ativadas neste dispositivo
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            Venda pendente quando o cliente gera o PIX, e venda aprovada quando
            paga. <b>No iPhone a notificação só aparece com o app fora da tela</b>{" "}
            (bloqueie o celular pra ver).
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            onClick={async () => {
              setLoading(true);
              const res = await sendTest();
              setLoading(false);
              if (res.ok) {
                toast.success(
                  `Enviado a ${res.delivered} dispositivo(s)! 🔒 Bloqueie o celular pra ver.`,
                  { duration: 8000 }
                );
              } else {
                toast.error(
                  res.message || "Falha ao enviar teste — tente reativar.",
                  { duration: 8000 }
                );
              }
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
              await refreshStatus();
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
  } else {
    card = (
      <div
        className="flex flex-col items-start gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
        style={{ background: T.primarySoft, border: `1px solid ${T.border}` }}
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
            Receba <b>venda pendente</b> quando o cliente gera o PIX e{" "}
            <b>venda aprovada</b> quando ele paga — direto na tela do celular.
          </p>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            const ok = await subscribe();
            setLoading(false);
            await refreshStatus();
            if (ok) toast.success("Notificações ativadas!");
            else toast.error("Não foi possível ativar. Veja o diagnóstico abaixo.");
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

  return (
    <div className="mb-5">
      {card}
      {/* Diagnóstico sempre visível — ajuda a achar problemas no iPhone */}
      <div
        className="mt-2 rounded-lg px-3 py-2 text-[11px] text-slate-500"
        style={{ background: "#F8FAFC", border: `1px solid ${T.border}` }}
      >
        🔎 <b>Diagnóstico:</b> permissão do navegador:{" "}
        <b className="text-slate-700">{perm || "—"}</b> · dispositivos recebendo
        no servidor:{" "}
        <b className="text-slate-700">{serverCount === null ? "…" : serverCount}</b>
        <button
          onClick={refreshStatus}
          className="ml-2 underline hover:text-slate-700"
        >
          atualizar
        </button>
      </div>
    </div>
  );
}
