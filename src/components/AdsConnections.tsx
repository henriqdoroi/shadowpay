"use client";

/**
 * AdsConnections — conexões de plataformas de Ads (Meta, TikTok, Kwai,
 * Google, X) pra trackear campanhas de tráfego pago.
 *
 * Tema white (gateway oficial). OAuth pra Meta/TikTok/Google/X e token
 * direto pro Kwai. O modal de conexão replica o fluxo "neste navegador"
 * vs "copiar link pra multilogin".
 */

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Facebook,
  Music2,
  Play,
  Plus,
  Plug,
  Trash2,
  Loader2,
  ExternalLink,
  Copy,
  X as XIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

/* ---------- Logos inline (Google 4 cores + X) ---------- */
function GoogleG({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2.1 1.5-4.8 2.5-7.6 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.5l6.5 5.5C39.9 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
function XLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* ---------- Metadados dos providers ---------- */
type ProviderUI = {
  code: "META" | "TIKTOK" | "KWAI" | "GOOGLE" | "X";
  name: string;
  subtitle: string;
  cta: string;
  kind: "oauth2" | "token";
  icon: React.ReactNode;
  iconBg: string;
  btnStyle: React.CSSProperties;
  note: React.ReactNode;
};

const PROVIDERS: ProviderUI[] = [
  {
    code: "META",
    name: "Meta Ads",
    subtitle: "Facebook + Instagram Ads — conecte um perfil e selecione as contas",
    cta: "Adicionar perfil",
    kind: "oauth2",
    icon: <Facebook className="h-5 w-5 text-white" />,
    iconBg: "#1877F2",
    btnStyle: { background: "#1877F2", color: "#FFFFFF" },
    note: (
      <>
        Importante: abra o ShadowPay no mesmo navegador onde o Facebook tá
        logado. Senão dá erro <code className="font-mono">invalid_state</code>.
      </>
    ),
  },
  {
    code: "TIKTOK",
    name: "TikTok Ads",
    subtitle: "Business Center — conecte e sincronize advertisers/campanhas",
    cta: "Adicionar Business Center",
    kind: "oauth2",
    icon: <Music2 className="h-5 w-5 text-white" />,
    iconBg: "linear-gradient(135deg, #25F4EE, #000000 55%, #FE2C55)",
    btnStyle: {
      background: "linear-gradient(135deg, #25F4EE, #FE2C55)",
      color: "#FFFFFF",
    },
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
    subtitle: "Marketing API — conecte via Access Token do Business Manager",
    cta: "Adicionar conta",
    kind: "token",
    icon: <Play className="h-5 w-5 text-white" fill="currentColor" />,
    iconBg: "#FF7A00",
    btnStyle: { background: "#FF7A00", color: "#FFFFFF" },
    note: (
      <>
        Diferente do Meta/TikTok, o Kwai usa Access Token direto (sem OAuth
        público). Gere em developers.kwai.com → Marketing API → My Apps.
      </>
    ),
  },
  {
    code: "GOOGLE",
    name: "Google Ads",
    subtitle: "OAuth + Conversions API — vendas atribuídas via gclid",
    cta: "Conectar Google",
    kind: "oauth2",
    icon: <GoogleG className="h-5 w-5" />,
    iconBg: "#FFFFFF",
    btnStyle: {
      background: "#FFFFFF",
      color: "#334155",
      border: "1px solid rgba(15,23,42,0.12)",
    },
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
    code: "X",
    name: "X Ads",
    subtitle: "OAuth — campanhas do X (antigo Twitter Ads)",
    cta: "Conectar X",
    kind: "oauth2",
    icon: <XLogo className="h-4 w-4 text-white" />,
    iconBg: "#000000",
    btnStyle: { background: "#0F172A", color: "#FFFFFF" },
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
  connectedAt: string;
};

const T = {
  border: "rgba(15,23,42,0.08)",
  borderSoft: "rgba(15,23,42,0.06)",
  amberBg: "rgba(245,158,11,0.10)",
  amberBorder: "rgba(245,158,11,0.30)",
};

export default function AdsConnections() {
  const { token } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // Modais
  const [oauthModal, setOauthModal] = useState<ProviderUI | null>(null);
  const [tokenModal, setTokenModal] = useState<ProviderUI | null>(null);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    try {
      const [conns, status] = await Promise.all([
        axios.get(`${API}/api/ads/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/api/ads/status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (conns.data?.success) setConnections(conns.data.data || []);
      if (status.data?.success) {
        const map: Record<string, boolean> = {};
        (status.data.data || []).forEach((p: any) => {
          map[p.code] = p.configured;
        });
        setConfigured(map);
      }
    } catch (e) {
      console.error("ads fetch", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Lê ?connected= / ?error= ao voltar do OAuth
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const connected = q.get("connected");
    const error = q.get("error");
    if (connected) {
      toast.success(`${connected.toUpperCase()} conectado com sucesso!`);
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

  const connectionsFor = (code: string) =>
    connections.filter((c) => c.provider === code);

  const handleCardAction = (p: ProviderUI) => {
    if (p.kind === "token") setTokenModal(p);
    else setOauthModal(p);
  };

  // Pega a URL de autorização do backend
  const getAuthUrl = async (p: ProviderUI): Promise<string | null> => {
    if (!token) return null;
    const ret = `${window.location.origin}/v1/tracking?tab=ads`;
    try {
      const r = await axios.get(
        `${API}/api/ads/${p.code.toLowerCase()}/oauth/start`,
        {
          params: { return: ret },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return r.data?.data?.url || null;
    } catch (e: any) {
      const code = e?.response?.data?.code;
      if (code === "PROVIDER_NOT_CONFIGURED") {
        toast.error(
          `${p.name} ainda não foi configurado pelo admin do gateway.`
        );
      } else {
        toast.error(e?.response?.data?.message || "Erro ao iniciar conexão.");
      }
      return null;
    }
  };

  const continueInBrowser = async (p: ProviderUI) => {
    setBusy(p.code);
    const url = await getAuthUrl(p);
    setBusy(null);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      setOauthModal(null);
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
    <div className="space-y-5">
      {PROVIDERS.map((p) => {
        const conns = connectionsFor(p.code);
        return (
          <section
            key={p.code}
            className="overflow-hidden rounded-2xl"
            style={{
              background: "#FFFFFF",
              border: `1px solid ${T.borderSoft}`,
              boxShadow:
                "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
            }}
          >
            {/* Header do card */}
            <div
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: p.iconBg,
                    border:
                      p.code === "GOOGLE"
                        ? "1px solid rgba(15,23,42,0.10)"
                        : "none",
                  }}
                >
                  {p.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-slate-900">
                    {p.name}
                  </h3>
                  <p className="text-[12.5px] leading-snug text-slate-500">
                    {p.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCardAction(p)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl px-4 text-[13px] font-semibold transition-opacity hover:opacity-90 sm:self-auto"
                style={p.btnStyle}
              >
                <Plus className="h-4 w-4" />
                {p.cta}
              </button>
            </div>

            {/* Corpo: conexões ou empty state */}
            <div className="p-4 sm:p-5">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : conns.length > 0 ? (
                <div className="space-y-2">
                  {conns.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                      style={{ background: "#F8FAFC", border: `1px solid ${T.borderSoft}` }}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-800">
                            {c.name || c.externalId || "Conta conectada"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Conectado em{" "}
                            {new Date(c.connectedAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => disconnect(c.id)}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <Plug className="mb-2 h-7 w-7 text-slate-300" />
                  <p className="text-[13.5px] font-medium text-slate-600">
                    {p.code === "META"
                      ? "Nenhum perfil Meta conectado ainda."
                      : p.code === "TIKTOK"
                      ? "Nenhum Business Center do TikTok conectado ainda."
                      : p.code === "KWAI"
                      ? "Nenhuma conta Kwai conectada ainda."
                      : p.code === "GOOGLE"
                      ? "Nenhuma conta Google Ads conectada ainda."
                      : "Nenhuma conta X Ads conectada ainda."}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-400">
                    Clique em{" "}
                    <span className="font-semibold text-slate-600">{p.cta}</span>{" "}
                    pra começar.
                  </p>
                  {/* Nota / pré-requisito */}
                  <div className="mt-3 flex max-w-xl items-start gap-2 rounded-xl px-3 py-2 text-left" style={{ background: T.amberBg, border: `1px solid ${T.amberBorder}` }}>
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p className="text-[11.5px] leading-relaxed text-amber-700">
                      {p.note}
                    </p>
                  </div>
                  {p.kind === "oauth2" && configured[p.code] === false && (
                    <p className="mt-2 text-[11px] font-medium text-slate-400">
                      Status: aguardando o admin configurar as credenciais.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Modal OAuth (escolha de navegador) */}
      {oauthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(15,23,42,0.45)" }}
          onClick={() => setOauthModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)" }}
          >
            <div className="mb-1 flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: oauthModal.iconBg,
                  border:
                    oauthModal.code === "GOOGLE"
                      ? "1px solid rgba(15,23,42,0.10)"
                      : "none",
                }}
              >
                {oauthModal.icon}
              </span>
              <h2 className="text-[17px] font-bold text-slate-900">
                Conectar {oauthModal.name}
              </h2>
            </div>
            <p className="mb-4 text-[13px] text-slate-500">
              Escolha como deseja conectar sua conta {oauthModal.name}.
            </p>

            <div
              className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5"
              style={{ background: T.amberBg, border: `1px solid ${T.amberBorder}` }}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-[12px] leading-relaxed text-amber-700">
                <strong>Atenção:</strong> abra o ShadowPay no mesmo navegador
                onde a conta tá logada. Se você usa Multilogin/Adspower, use o
                botão <strong>Copiar link</strong> abaixo.
              </p>
            </div>

            <button
              onClick={() => continueInBrowser(oauthModal)}
              disabled={busy === oauthModal.code}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white disabled:opacity-60"
              style={{ background: "#2563EB" }}
            >
              {busy === oauthModal.code ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Continuar neste navegador (nova aba)
            </button>
            <p className="mb-3 mt-1.5 text-center text-[11.5px] text-slate-400">
              Conecta diretamente no navegador atual (precisa estar logado aqui)
            </p>

            <button
              onClick={() => copyAuthLink(oauthModal)}
              disabled={busy === oauthModal.code}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-slate-700 disabled:opacity-60"
              style={{ background: "#F1F5F9", border: "1px solid rgba(15,23,42,0.08)" }}
            >
              <Copy className="h-4 w-4" />
              Copiar link para navegador multilogin
            </button>
            <p className="mb-4 mt-1.5 text-center text-[11.5px] text-slate-400">
              Cole em outro navegador onde a conta tá logada (Multilogin/Adspower)
            </p>

            <button
              onClick={() => setOauthModal(null)}
              className="h-11 w-full rounded-xl text-[13px] font-semibold text-slate-500 hover:bg-slate-50"
              style={{ border: "1px solid rgba(15,23,42,0.08)" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal token (Kwai) */}
      {tokenModal && (
        <TokenModal
          provider={tokenModal}
          token={token!}
          onClose={() => setTokenModal(null)}
          onConnected={() => {
            setTokenModal(null);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

/* ---------- Modal de conexão por token (Kwai) ---------- */
function TokenModal({
  provider,
  token,
  onClose,
  onConnected,
}: {
  provider: ProviderUI;
  token: string;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [accessToken, setAccessToken] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!accessToken.trim()) {
      toast.error("Cole o Access Token.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `${API}/api/ads/${provider.code.toLowerCase()}/token`,
        { accessToken: accessToken.trim(), name: name.trim() || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${provider.name} conectado!`);
      onConnected();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao conectar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)" }}
      >
        <div className="mb-1 flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: provider.iconBg }}
          >
            {provider.icon}
          </span>
          <h2 className="text-[17px] font-bold text-slate-900">
            Conectar {provider.name}
          </h2>
        </div>
        <p className="mb-4 text-[13px] text-slate-500">
          Cole o Access Token do {provider.name}. Gere em developers.kwai.com →
          Marketing API → My Apps.
        </p>

        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Access Token
        </label>
        <input
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="Cole aqui o Access Token"
          className="mb-3 h-11 w-full rounded-xl bg-slate-50 px-3 font-mono text-[13px] text-slate-700 outline-none"
          style={{ border: "1px solid rgba(15,23,42,0.08)" }}
        />

        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Nome (opcional)
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Conta principal Kwai"
          className="mb-5 h-11 w-full rounded-xl bg-slate-50 px-3 text-[13px] text-slate-700 outline-none"
          style={{ border: "1px solid rgba(15,23,42,0.08)" }}
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-xl text-[13px] font-semibold text-slate-500 hover:bg-slate-50"
            style={{ border: "1px solid rgba(15,23,42,0.08)" }}
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60"
            style={{ background: provider.btnStyle.background as string }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
}
