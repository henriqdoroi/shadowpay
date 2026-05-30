"use client";

/**
 * AdsConnections — conexões de plataformas de Ads (Meta, Google, TikTok,
 * Kwai, X) pra trackear campanhas de tráfego pago. Tema white.
 *
 * Layout em acordeão: cada plataforma é uma linha [logo · nome · chevron].
 * Ao expandir, aparece "Adicionar perfil" (OAuth: popup navegador/multilogin)
 * ou "Adicionar conta" (Kwai: fluxo Agência/Conta de Anúncio).
 */

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Facebook,
  Music2,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  MoreVertical,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

/* ===================== Logos inline ===================== */
function MetaBadge() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "#1877F2" }}>
      <Facebook className="h-5 w-5 text-white" fill="currentColor" />
    </span>
  );
}
function GoogleAdsBadge() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white" style={{ border: "1px solid rgba(15,23,42,0.10)" }}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect x="6.6" y="2.5" width="4.8" height="14.5" rx="2.4" fill="#FBBC04" transform="rotate(-28 12 12)" />
        <rect x="12.6" y="2.5" width="4.8" height="14.5" rx="2.4" fill="#4285F4" transform="rotate(28 12 12)" />
        <circle cx="7.5" cy="18.2" r="2.8" fill="#FBBC04" />
      </svg>
    </span>
  );
}
function TikTokBadge() {
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#010101" }}>
      <Music2 className="absolute h-5 w-5" style={{ color: "#25F4EE", transform: "translate(1px,1px)" }} />
      <Music2 className="absolute h-5 w-5" style={{ color: "#FE2C55", transform: "translate(-1px,-1px)" }} />
      <Music2 className="relative h-5 w-5 text-white" />
    </span>
  );
}
function KwaiBadge() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#FF6A00" }}>
      <span className="text-[15px] font-black italic text-white">K</span>
    </span>
  );
}
function XBadge() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#0F172A" }}>
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    </span>
  );
}

/* ===================== Providers ===================== */
type ProviderCode = "META" | "GOOGLE" | "TIKTOK" | "KWAI" | "X";
type ProviderUI = {
  code: ProviderCode;
  name: string;
  kind: "oauth2" | "kwai";
  badge: React.ReactNode;
  cta: string;
  note: React.ReactNode;
};

const PROVIDERS: ProviderUI[] = [
  {
    code: "META",
    name: "Meta Ads",
    kind: "oauth2",
    badge: <MetaBadge />,
    cta: "Adicionar perfil",
    note: (
      <>
        Importante: abra o ShadowPay no mesmo navegador onde o Facebook tá
        logado. Senão dá erro <code className="font-mono">invalid_state</code>.
      </>
    ),
  },
  {
    code: "GOOGLE",
    name: "Google Ads",
    kind: "oauth2",
    badge: <GoogleAdsBadge />,
    cta: "Adicionar perfil",
    note: (
      <>
        Pré-requisito: o admin do ShadowPay precisa de{" "}
        <code className="font-mono">GOOGLE_OAUTH_CLIENT_ID</code>,{" "}
        <code className="font-mono">GOOGLE_OAUTH_CLIENT_SECRET</code> e{" "}
        <code className="font-mono">GOOGLE_ADS_DEVELOPER_TOKEN</code> no env.
      </>
    ),
  },
  {
    code: "TIKTOK",
    name: "TikTok Ads",
    kind: "oauth2",
    badge: <TikTokBadge />,
    cta: "Adicionar perfil",
    note: (
      <>
        Você precisa ser admin/operador do Business Center no TikTok pra
        autorizar.
      </>
    ),
  },
  {
    code: "KWAI",
    name: "Kwai Ads",
    kind: "kwai",
    badge: <KwaiBadge />,
    cta: "Adicionar conta",
    note: (
      <>
        Informe o tipo de conta (Agência ou Conta de Anúncio) e os IDs do Kwai
        Business Manager.
      </>
    ),
  },
  {
    code: "X",
    name: "X Ads",
    kind: "oauth2",
    badge: <XBadge />,
    cta: "Adicionar perfil",
    note: (
      <>
        Antigo Twitter Ads. Precisa de um app no X Developer Portal (
        <code className="font-mono">X_OAUTH_CLIENT_ID</code> /{" "}
        <code className="font-mono">X_OAUTH_CLIENT_SECRET</code>).
      </>
    ),
  },
];

type Connection = {
  id: string;
  provider: string;
  externalId?: string | null;
  name?: string | null;
  status: string;
  meta?: any;
  connectedAt: string;
};

const AMBER = { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)" };
const CARD: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid rgba(15,23,42,0.06)",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
};

export default function AdsConnections() {
  const { token } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ProviderCode | null>(null);

  const [oauthModal, setOauthModal] = useState<ProviderUI | null>(null);
  const [kwaiModal, setKwaiModal] = useState<ProviderUI | null>(null);
  // Kwai: id da conexão (agência) recém-salva, pra ligar o token no OAuth
  const [pendingKwaiCid, setPendingKwaiCid] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    try {
      const r = await axios.get(`${API}/api/ads/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) setConnections(r.data.data || []);
    } catch (e) {
      console.error("ads fetch", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Lê ?connected= / ?error= ao voltar do OAuth (fallback sem popup)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const connected = q.get("connected");
    const error = q.get("error");
    if (connected) {
      toast.success(`${connected.toUpperCase()} conectado com sucesso!`);
      setExpanded(connected.toUpperCase() as ProviderCode);
      fetchAll();
    } else if (error) {
      toast.error(`Falha ao conectar: ${error}`);
    }
    if (connected || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recebe o aviso do POPUP de OAuth (postMessage) → fecha e atualiza
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "ads-oauth") return;
      const { connected, error } = e.data;
      setOauthModal(null);
      setPendingKwaiCid(null);
      if (connected) {
        toast.success(`${String(connected).toUpperCase()} conectado com sucesso!`);
        setExpanded(String(connected).toUpperCase() as ProviderCode);
        fetchAll();
      } else if (error) {
        toast.error(`Falha ao conectar: ${error}`);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectionsFor = (code: string) =>
    connections.filter((c) => c.provider === code);

  const openConnect = (p: ProviderUI) => {
    if (p.kind === "kwai") setKwaiModal(p);
    else setOauthModal(p);
  };

  const getAuthUrl = async (p: ProviderUI): Promise<string | null> => {
    if (!token) return null;
    const ret = `${window.location.origin}/oauth-ads`;
    const params: Record<string, string> = { return: ret };
    if (p.code === "KWAI" && pendingKwaiCid) params.cid = pendingKwaiCid;
    try {
      const r = await axios.get(
        `${API}/api/ads/${p.code.toLowerCase()}/oauth/start`,
        { params, headers: { Authorization: `Bearer ${token}` } }
      );
      return r.data?.data?.url || null;
    } catch (e: any) {
      if (e?.response?.data?.code === "PROVIDER_NOT_CONFIGURED") {
        if (p.code === "KWAI") {
          toast.success(
            "Conta Kwai salva! A autorização com o Business Center liga quando o app do Kwai for liberado/configurado."
          );
        } else {
          toast.error(`${p.name} ainda não foi configurado pelo admin do gateway.`);
        }
      } else {
        toast.error(e?.response?.data?.message || "Erro ao iniciar conexão.");
      }
      return null;
    }
  };

  // Abre a autorização num POPUP centralizado (não em aba nova)
  const openPopup = (url: string) => {
    const w = 520;
    const h = 680;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
    const popup = window.open(
      url,
      "shadowpay_ads_oauth",
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
    if (!popup) {
      // bloqueio de popup → cai pra aba nova
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      popup.focus();
    }
  };

  const continueInBrowser = async (p: ProviderUI) => {
    setBusy(p.code);
    const url = await getAuthUrl(p);
    setBusy(null);
    if (url) {
      openPopup(url);
      // mantém o modal pra mostrar feedback até o popup avisar (postMessage)
    }
  };

  const copyAuthLink = async (p: ProviderUI) => {
    setBusy(p.code);
    const url = await getAuthUrl(p);
    setBusy(null);
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado! Cole no navegador onde a conta tá logada.");
    }
  };

  const disconnect = async (id: string) => {
    if (!confirm("Desconectar essa conta?")) return;
    try {
      await axios.delete(`${API}/api/ads/connections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Conta desconectada.");
      fetchAll();
    } catch {
      toast.error("Erro ao desconectar.");
    }
  };

  return (
    <div className="space-y-3">
      {PROVIDERS.map((p) => {
        const open = expanded === p.code;
        const conns = connectionsFor(p.code);
        return (
          <div key={p.code} className="overflow-hidden rounded-2xl" style={CARD}>
            {/* Linha (header acordeão) */}
            <button
              onClick={() => setExpanded(open ? null : p.code)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                {p.badge}
                <span className="text-[15px] font-bold text-slate-900">
                  {p.name}
                </span>
                {conns.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {conns.length}
                  </span>
                )}
              </div>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-transform"
                style={{
                  background: "rgba(15,23,42,0.04)",
                  transform: open ? "rotate(180deg)" : "none",
                }}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
            </button>

            {/* Corpo expandido */}
            {open && (
              <div
                className="px-4 pb-4 pt-3"
                style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}
              >
                {/* Conecte seus perfis */}
                <p className="mb-2 text-[13px] text-slate-500">
                  {p.kind === "kwai"
                    ? "Conecte sua conta Kwai por aqui:"
                    : "Conecte seus perfis por aqui:"}
                </p>

                {conns.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {conns.map((c) => (
                      <ProfileRow
                        key={c.id}
                        connection={c}
                        onRemove={() => disconnect(c.id)}
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={() => openConnect(p)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#2563EB" }}
                >
                  <Plus className="h-4 w-4" />
                  {p.cta}
                </button>

                {/* Nota — só quando ainda não conectou */}
                {conns.length === 0 && (
                  <div
                    className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2"
                    style={{ background: AMBER.bg, border: `1px solid ${AMBER.border}` }}
                  >
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p className="text-[11.5px] leading-relaxed text-amber-700">
                      {p.note}
                    </p>
                  </div>
                )}

                {/* Contas de Anúncio — quando há perfil conectado */}
                {conns.length > 0 && token && (
                  <div
                    className="mt-4 overflow-hidden rounded-xl"
                    style={{ background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.06)" }}
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-2.5"
                      style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
                    >
                      <h4 className="text-[14px] font-bold text-slate-900">
                        Contas de Anúncio ({p.name.replace(" Ads", "")})
                      </h4>
                    </div>
                    <div className="p-3">
                      <p className="mb-2 text-[12px] text-slate-500">
                        Escolha suas contas de anúncio:
                      </p>
                      <div className="space-y-2">
                        {conns.map((c) => (
                          <ProfileAccounts
                            key={c.id}
                            connection={c}
                            token={token}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal OAuth (navegador / multilogin) */}
      {oauthModal && (() => {
        const isKwai = oauthModal.code === "KWAI";
        const closeOauth = () => {
          setOauthModal(null);
          setPendingKwaiCid(null);
        };
        return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(15,23,42,0.45)" }}
          onClick={closeOauth}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)" }}
          >
            <div className="mb-1 flex items-center gap-2.5">
              {oauthModal.badge}
              <h2 className="text-[17px] font-bold text-slate-900">
                Conectar {oauthModal.name}
              </h2>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-slate-500">
              {isKwai ? (
                <>
                  Escolha como deseja conectar sua conta Kwai Ads. É necessário
                  estar logado no Business Center Kwai no navegador que irá
                  realizar a conexão.
                </>
              ) : (
                <>Escolha como deseja conectar sua conta {oauthModal.name}.</>
              )}
            </p>

            {!isKwai && (
              <div
                className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5"
                style={{ background: AMBER.bg, border: `1px solid ${AMBER.border}` }}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-[12px] leading-relaxed text-amber-700">
                  <strong>Atenção:</strong> abra o ShadowPay no mesmo navegador
                  onde a conta tá logada. Se você usa Multilogin/Adspower, use o
                  botão <strong>Copiar link</strong> abaixo.
                </p>
              </div>
            )}

            <button
              onClick={() => continueInBrowser(oauthModal)}
              disabled={busy === oauthModal.code}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white disabled:opacity-60"
              style={{ background: isKwai ? "#FF6A00" : "#2563EB" }}
            >
              {busy === oauthModal.code ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Continuar neste navegador
            </button>
            <p className="mb-3 mt-1.5 text-center text-[11.5px] text-slate-400">
              {isKwai
                ? "Conecte sua conta Kwai Ads diretamente neste navegador"
                : "Conecta diretamente no navegador atual (precisa estar logado aqui)"}
            </p>

            <button
              onClick={() => copyAuthLink(oauthModal)}
              disabled={busy === oauthModal.code}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold disabled:opacity-60"
              style={
                isKwai
                  ? { background: "#0F172A", color: "#FFFFFF" }
                  : { background: "#F1F5F9", color: "#334155", border: "1px solid rgba(15,23,42,0.08)" }
              }
            >
              <Copy className="h-4 w-4" />
              Copiar link para navegador multilogin
            </button>
            <p className="mb-4 mt-1.5 text-center text-[11.5px] text-slate-400">
              {isKwai
                ? "Gere um link para conectar em outro navegador ou compartilhar com colaboradores"
                : "Cole em outro navegador onde a conta tá logada (Multilogin/Adspower)"}
            </p>

            <button
              onClick={closeOauth}
              className="h-11 w-full rounded-xl text-[13px] font-semibold text-slate-500 hover:bg-slate-50"
              style={{ border: "1px solid rgba(15,23,42,0.08)" }}
            >
              Cancelar
            </button>
          </div>
        </div>
        );
      })()}

      {/* Modal Kwai (Agência / Conta de Anúncio) → depois abre o OAuth */}
      {kwaiModal && (
        <KwaiModal
          token={token!}
          onClose={() => setKwaiModal(null)}
          onSaved={(id) => {
            setKwaiModal(null);
            setExpanded("KWAI");
            fetchAll();
            // Abre o popup "Conectar Kwai Ads" (OAuth Business Center)
            const kwai = PROVIDERS.find((p) => p.code === "KWAI")!;
            setPendingKwaiCid(id);
            setOauthModal(kwai);
          }}
        />
      )}
    </div>
  );
}

/* ===================== Modal Kwai (multi-step) ===================== */
function KwaiModal({
  token,
  onClose,
  onSaved,
}: {
  token: string;
  onClose: () => void;
  onSaved: (connectionId: string) => void;
}) {
  const [accountType, setAccountType] = useState<"AGENCY" | "AD_ACCOUNT">("AGENCY");
  const [agencyId, setAgencyId] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adAccounts, setAdAccounts] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [newAccount, setNewAccount] = useState("");
  const [saving, setSaving] = useState(false);

  const canContinue =
    !!agencyId.trim() &&
    !!agencyName.trim() &&
    (accountType === "AGENCY" || adAccounts.length > 0);

  const confirmAdAccount = () => {
    const v = newAccount.trim();
    if (!v) return;
    setAdAccounts((prev) => Array.from(new Set([...prev, v])));
    setNewAccount("");
    setAdding(false);
  };

  const submit = async () => {
    if (!canContinue) return;
    setSaving(true);
    try {
      const r = await axios.post(
        `${API}/api/ads/kwai/connect`,
        {
          accountType,
          agencyId: agencyId.trim(),
          agencyName: agencyName.trim(),
          adAccountIds: adAccounts,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSaved(r.data?.data?.id || "");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao conectar Kwai.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "h-11 w-full rounded-xl bg-slate-50 px-3 text-[14px] text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-violet-100";
  const inputStyle = { border: "1px solid rgba(15,23,42,0.10)" } as React.CSSProperties;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <KwaiBadge />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="px-6 pb-6 pt-3">
          <h2 className="mb-4 text-center text-[18px] font-bold text-slate-900">
            Escolha seu tipo de conta e preencha os dados necessários
          </h2>

          {/* Toggle tipo */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            {([
              { id: "AGENCY", label: "Agência" },
              { id: "AD_ACCOUNT", label: "Conta de Anúncio" },
            ] as const).map((opt) => {
              const active = accountType === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAccountType(opt.id)}
                  className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors"
                  style={{
                    background: active ? "rgba(37,99,235,0.06)" : "#FFFFFF",
                    color: active ? "#2563EB" : "#475569",
                    border: `1px solid ${active ? "#2563EB" : "rgba(15,23,42,0.10)"}`,
                  }}
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ border: `2px solid ${active ? "#2563EB" : "#CBD5E1"}` }}
                  >
                    {active && (
                      <span className="h-2 w-2 rounded-full" style={{ background: "#2563EB" }} />
                    )}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Id da agência */}
          <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Id da agência
          </label>
          <input
            value={agencyId}
            onChange={(e) => setAgencyId(e.target.value)}
            placeholder="12345678"
            className={`mb-4 ${inputCls}`}
            style={inputStyle}
          />

          {/* Nome da agência */}
          <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Nome da agência
          </label>
          <input
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            placeholder="Kwai Ads LTDA"
            className={`${inputCls}`}
            style={inputStyle}
          />

          {/* Contas de Anúncio (só quando AD_ACCOUNT) */}
          {accountType === "AD_ACCOUNT" && (
            <div className="mt-5" style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 16 }}>
              <p className="mb-3 text-[16px] font-bold text-slate-900">
                Contas de Anúncio
              </p>

              {adAccounts.length > 0 && (
                <div className="mb-3 space-y-2">
                  {adAccounts.map((acc) => (
                    <div
                      key={acc}
                      className="flex items-center justify-between rounded-xl px-3 py-2"
                      style={{ background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.06)" }}
                    >
                      <span className="font-mono text-[13px] text-slate-700">{acc}</span>
                      <button
                        onClick={() => setAdAccounts((p) => p.filter((x) => x !== acc))}
                        className="text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {adding ? (
                <div
                  className="rounded-xl p-3"
                  style={{ background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.08)" }}
                >
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                    Id da conta de anúncios Kwai
                  </label>
                  <input
                    autoFocus
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmAdAccount()}
                    placeholder="8226212"
                    className={`mb-3 ${inputCls}`}
                    style={{ border: "1px solid rgba(15,23,42,0.10)", background: "#FFFFFF" }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAdding(false);
                        setNewAccount("");
                      }}
                      className="h-9 flex-1 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-white"
                      style={{ border: "1px solid rgba(15,23,42,0.10)" }}
                    >
                      Fechar
                    </button>
                    <button
                      onClick={confirmAdAccount}
                      className="h-9 flex-1 rounded-lg text-[13px] font-semibold text-white"
                      style={{ background: "#2563EB" }}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-700"
                  style={{ background: "#F1F5F9", border: "1px solid rgba(15,23,42,0.10)" }}
                >
                  Adicionar <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Continuar */}
          <button
            onClick={submit}
            disabled={!canContinue || saving}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "#FF6A00" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== Perfil conectado (com menu ⋮) ===================== */
function ProfileRow({
  connection,
  onRemove,
}: {
  connection: Connection;
  onRemove: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div
      className="relative flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
      style={{ background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        <span className="truncate text-[13px] font-semibold text-slate-800">
          {connection.name || connection.externalId || "Conta conectada"}
        </span>
      </div>
      <div className="relative shrink-0">
        <button
          onClick={() => setMenu((m) => !m)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div
              className="absolute right-0 top-8 z-20 w-32 overflow-hidden rounded-lg bg-white py-1"
              style={{
                border: "1px solid rgba(15,23,42,0.08)",
                boxShadow: "0 12px 32px -12px rgba(15,23,42,0.25)",
              }}
            >
              <button
                onClick={() => {
                  setMenu(false);
                  onRemove();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =============== Contas de anúncio de um perfil (fetch real) =============== */
function ProfileAccounts({
  connection,
  token,
}: {
  connection: Connection;
  token: string;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(
        `${API}/api/ads/connections/${connection.id}/accounts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccounts(r.data?.data || []);
      setSelected(r.data?.selected || []);
      setNote(r.data?.note || null);
    } catch {
      setNote("fetch_failed");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const toggle = () => {
    const n = !open;
    setOpen(n);
    if (n && !loaded) load();
  };

  const toggleAccount = async (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(next);
    try {
      await axios.post(
        `${API}/api/ads/connections/${connection.id}/accounts`,
        { selected: next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      toast.error("Erro ao salvar seleção.");
    }
  };

  return (
    <div
      className="overflow-hidden rounded-xl bg-white"
      style={{ border: "1px solid rgba(15,23,42,0.08)" }}
    >
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50"
      >
        <span className="text-[13px] font-semibold text-slate-800">
          {connection.name || connection.externalId}
          <span className="ml-1.5 font-normal text-slate-400">
            ({selected.length})
          </span>
        </span>
        <ChevronRight
          className="h-4 w-4 text-slate-400 transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        />
      </button>
      {open && (
        <div
          className="px-3 py-2"
          style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}
        >
          {loading ? (
            <div className="flex justify-center py-3 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="py-2 text-[12px] leading-relaxed text-slate-400">
              {note === "missing_token"
                ? "Conecte o perfil primeiro pra listar as contas."
                : note
                ? "Nenhuma conta encontrada ainda. Se você acabou de criar o token de desenvolvedor, pode ser que ele precise de “acesso básico” aprovado pelo Google."
                : "Nenhuma conta de anúncio encontrada."}
            </p>
          ) : (
            <div className="space-y-1">
              {accounts.map((a) => {
                const on = selected.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAccount(a.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
                  >
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
                      style={{
                        background: on ? "#2563EB" : "#FFFFFF",
                        border: `1px solid ${on ? "#2563EB" : "rgba(15,23,42,0.20)"}`,
                      }}
                    >
                      {on && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="font-mono text-[12.5px] text-slate-700">
                      {a.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
