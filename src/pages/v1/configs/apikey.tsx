"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { toast } from "sonner";
import {
  Copy,
  CheckCircle,
  Key,
  Globe,
  ShieldCheck,
  Sparkles,
  FileText,
  ArrowUpRight,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

/* Ferramentas de IA — abrem em nova aba com o prompt já no clipboard */
const AI_TOOLS = [
  { id: "chatgpt", label: "Abrir ChatGPT", url: "https://chatgpt.com/" },
  { id: "claude", label: "Abrir Claude", url: "https://claude.ai/new" },
  { id: "gemini", label: "Abrir Gemini", url: "https://gemini.google.com/app" },
];

/**
 * Monta o prompt de integração via IA. Inclui a documentação real da
 * API de PIX da ShadowPay pra a IA gerar código que funciona de verdade.
 */
function buildAiPrompt(publicKey?: string): string {
  const pk = publicKey || "pk_live_SUA_CHAVE_PUBLICA";
  return `Você é um desenvolvedor especialista em integração de gateways de pagamento PIX.

Preciso que você integre o gateway ShadowPay no meu checkout/site e gere o código completo e funcional.

DOCUMENTAÇÃO DA API SHADOWPAY:

Base URL: ${API}

Autenticação: Bearer Token no header
  Authorization: Bearer [COLE SUA CHAVE SECRETA AQUI]
  (sua chave secreta começa com sk_live_ — pegue no painel em Chaves de API)
  Minha chave pública (referência): ${pk}

ENDPOINTS:

1) Criar cobrança PIX
POST /api/v1/pix/charges
Body (JSON):
{
  "amount": 199.90,                       // valor em reais
  "customerName": "Nome do Cliente",
  "customerEmail": "cliente@email.com",
  "customerCpfCnpj": "12345678900",
  "description": "Pedido #1234",
  "externalReference": "[COLE O ID DO PEDIDO]"
}
Resposta:
{
  "success": true,
  "data": {
    "id": "uuid-da-cobranca",
    "status": "pending",
    "amount": "199.90",
    "pix": {
      "copyPaste": "00020126...",          // código PIX copia-e-cola
      "qrCodeUrl": "https://..."            // imagem do QR Code
    },
    "expiresAt": "2026-..."
  }
}

2) Consultar status da cobrança
GET /api/v1/pix/charges/{id}
Resposta: mesmo formato, com status "pending" | "approved" | "expired"

3) Testar autenticação
GET /api/v1/ping

REQUISITOS DA INTEGRAÇÃO:
- Crie um botão "Pagar com PIX" no meu checkout.
- Ao clicar, chame POST /api/v1/pix/charges e mostre o QR Code + o copia-e-cola.
- Faça polling no GET /api/v1/pix/charges/{id} a cada 5 segundos.
- Quando o status virar "approved", mostre uma tela de "Pagamento aprovado".
- IMPORTANTE: a chave secreta NUNCA pode ficar exposta no frontend. Chame a API a partir de um backend/servidor.

Me diga qual linguagem/framework você vai usar, gere o código completo e explique passo a passo como rodar.`;
}

interface ApiKey {
  id: string;
  publicKey: string;
  privateKey?: string;
  seller_ip?: string;
  createdAt: string;
  lastUsedAt?: string;
}

function ApiKeyContent() {
  const { user, token } = useAuth();
  const [credentials, setCredentials] = useState<ApiKey[]>([]);
  const [, setLoading] = useState(true);
  const [showNewKeysModal, setShowNewKeysModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<ApiKey | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [sellerIp, setSellerIp] = useState<string>("");
  const [promptCopied, setPromptCopied] = useState(false);

  const fetchCredentials = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) {
        setCredentials(r.data.data);
        if (r.data.data?.length > 0) {
          setSellerIp(r.data.data[0]?.seller_ip ?? "");
        }
      } else {
        toast.error("Erro ao carregar credenciais");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (key: string, type: string) => {
    navigator.clipboard.writeText(key);
    toast.success(`${type} copiada!`);
  };

  const handleConfirmNewKeys = () => {
    if (newApiKey) {
      fetchCredentials();
      setNewApiKey(null);
      setShowNewKeysModal(false);
    }
  };

  const updateSellerIp = async () => {
    if (!token || !credentials[0]) return;
    try {
      await axios.put(
        `${API}/api/credentials/${credentials[0].id}/ip`,
        { seller_ip: sellerIp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("IP atualizado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar IP");
    }
  };

  const generateCredentials = async () => {
    if (!token) return;
    setIsGenerating(true);
    try {
      const r = await axios.post(
        `${API}/api/credentials`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        setNewApiKey(r.data.data);
        setShowNewKeysModal(true);
        toast.success(r.data.message || "Credenciais geradas!");
      } else {
        toast.error("Erro ao gerar credenciais");
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Erro ao conectar com o servidor"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const renewCredentials = async (id: string) => {
    if (!token) return;
    setRenewingId(id);
    try {
      const r = await axios.put(
        `${API}/api/credentials/${id}/renew`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        setNewApiKey(r.data.data);
        setShowNewKeysModal(true);
        toast.success(r.data.message || "Credenciais renovadas!");
      } else {
        toast.error("Erro ao renovar");
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Erro ao conectar com o servidor"
      );
    } finally {
      setRenewingId(null);
    }
  };

  useEffect(() => {
    if (user && token) fetchCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const current = credentials.length > 0 ? credentials[0] : null;
  const has = !!current;

  const aiPrompt = buildAiPrompt(current?.publicKey);

  const copyPrompt = () => {
    navigator.clipboard.writeText(aiPrompt);
    setPromptCopied(true);
    toast.success("Prompt copiado! Cole na IA.");
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const openAiTool = (url: string) => {
    navigator.clipboard.writeText(aiPrompt).catch(() => undefined);
    toast.success("Prompt copiado — é só colar (Ctrl+V).");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  return (
    <>
      <Head>
        <title>ShadowPay — Chaves de API</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            Integrações
          </p>
          <h1
            className="text-[22px] font-bold tracking-tight sm:text-[28px] text-slate-900"
            style={{
              fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
              letterSpacing: "-0.005em",
            }}
          >
            Chaves de API
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[14px] text-slate-500">
            Use estas chaves pra integrar a API de PIX da ShadowPay no seu site
            ou checkout.
            <Link
              href="/v1/configs/api-docs"
              className="inline-flex items-center gap-1 font-semibold text-violet-600 transition-colors hover:text-violet-700"
            >
              Ver documentação
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </header>

        {/* Card credenciais */}
        <div
          className="mb-6 rounded-2xl p-6"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Key className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Suas credenciais
            </span>
          </div>

          {has && current ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">
                  Public key
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={current.publicKey}
                    readOnly
                    className={inputCls}
                  />
                  <button
                    onClick={() => handleCopyKey(current.publicKey, "Chave pública")}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-500">
                  Private key
                </label>
                <input
                  type="password"
                  value="••••••••••••••••••••••••••••••••••••"
                  readOnly
                  className={inputCls}
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Por segurança, a chave privada só é exibida no momento da criação.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block flex items-center gap-1.5 text-xs text-slate-500">
                  <Globe className="h-3.5 w-3.5" /> IP autorizado
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={sellerIp}
                    onChange={(e) => setSellerIp(e.target.value)}
                    placeholder="Ex: 187.45.123.67"
                    className={inputCls}
                  />
                  <button
                    onClick={updateSellerIp}
                    className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white"
                    style={{
                      background: "#7C3AED",
                      boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
                    }}
                  >
                    Salvar IP
                  </button>
                </div>
              </div>

              <div
                className="flex flex-col items-start justify-between gap-2 pt-4 sm:flex-row sm:items-center"
                style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
              >
                <p className="text-xs text-slate-400">
                  Para girar as chaves, gere um novo par. A chave anterior é revogada.
                </p>
                <button
                  onClick={() => renewCredentials(current.id)}
                  disabled={renewingId === current.id}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {renewingId === current.id ? "Renovando…" : "Renovar credenciais"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Key className="h-7 w-7 text-violet-400" />
              <p className="text-sm text-slate-600">
                Você ainda não tem credenciais. Gere agora para integrar com a API.
              </p>
              <button
                onClick={generateCredentials}
                disabled={isGenerating}
                className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-60"
                style={{
                  background: "#7C3AED",
                  boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
                }}
              >
                {isGenerating ? "Gerando…" : "Gerar credenciais"}
              </button>
            </div>
          )}
        </div>

        {/* Integração via IA */}
        <div
          className="mb-6 overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #12091F 0%, #1A1130 55%, #0E1330 100%)",
            border: "1px solid rgba(124,58,237,0.30)",
            boxShadow: "0 20px 50px -24px rgba(124,58,237,0.45)",
          }}
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(124,58,237,0.22)",
                  border: "1px solid rgba(167,139,250,0.30)",
                  color: "#C4B5FD",
                }}
              >
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[16px] font-bold text-white">
                  Integração via IA{" "}
                  <span className="font-semibold text-violet-300">
                    (ChatGPT, Claude, Gemini)
                  </span>
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-300/80">
                  Copie o prompt abaixo e cole numa IA. Substitua{" "}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11.5px] text-violet-200">
                    [COLE SUA CHAVE SECRETA AQUI]
                  </code>{" "}
                  e{" "}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11.5px] text-violet-200">
                    [COLE O ID DO PEDIDO]
                  </code>{" "}
                  com seus dados reais. A IA gera o código completo pra integrar
                  a ShadowPay no seu checkout em minutos.
                </p>
              </div>
            </div>

            {/* Prompt box */}
            <div
              className="relative mt-4 overflow-hidden rounded-xl"
              style={{
                background: "rgba(2,6,23,0.55)",
                border: "1px solid rgba(148,163,184,0.16)",
              }}
            >
              <button
                onClick={copyPrompt}
                className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors"
                style={{
                  background: promptCopied
                    ? "rgba(16,185,129,0.20)"
                    : "rgba(124,58,237,0.85)",
                }}
              >
                {promptCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copiar prompt
                  </>
                )}
              </button>
              <pre className="max-h-64 overflow-auto px-4 py-4 pr-28 text-[12px] leading-relaxed">
                <code
                  className="font-mono text-slate-300"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {aiPrompt}
                </code>
              </pre>
            </div>

            {/* Abrir IA */}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {AI_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => openAiTool(tool.url)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(148,163,184,0.20)",
                  }}
                >
                  <Sparkles className="h-4 w-4 text-violet-300" />
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h2
              className="text-[14px] font-semibold text-slate-900"
              style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
            >
              Histórico de credenciais
            </h2>
          </div>

          {has ? (
            <div className="overflow-x-auto p-2 sm:p-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                    <th className="px-3 py-2.5 font-semibold">Public key</th>
                    <th className="px-3 py-2.5 font-semibold">IP</th>
                    <th className="px-3 py-2.5 font-semibold">Criada em</th>
                    <th className="px-3 py-2.5 font-semibold">Último uso</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((c) => (
                    <tr
                      key={c.id}
                      style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                    >
                      <td className="px-3 py-3 font-mono text-xs text-slate-700">
                        {c.publicKey.substring(0, 16)}…
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {c.seller_ip || "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {new Date(c.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {c.lastUsedAt
                          ? new Date(c.lastUsedAt).toLocaleString("pt-BR")
                          : "Nunca"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => renewCredentials(c.id)}
                          disabled={renewingId === c.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {renewingId === c.id ? "Renovando…" : "Renovar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Key className="mx-auto mb-3 h-6 w-6 text-violet-300" />
              <p className="text-sm font-medium text-slate-600">
                Nenhuma credencial ainda
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Gere suas chaves para integrar com a API.
              </p>
            </div>
          )}
        </div>
      </LightShell>

      {/* Modal novas credenciais */}
      <Dialog open={showNewKeysModal} onOpenChange={setShowNewKeysModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Credenciais geradas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Credenciais geradas com sucesso!
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-700/80">
                    Copie e guarde suas chaves em um local seguro.
                  </p>
                </div>
              </div>
            </div>

            {newApiKey && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">
                    Public key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={newApiKey.publicKey}
                      readOnly
                      className={inputCls}
                    />
                    <button
                      onClick={() =>
                        handleCopyKey(newApiKey.publicKey, "Chave pública")
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">
                    Private key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={newApiKey.privateKey || ""}
                      readOnly
                      className={inputCls}
                    />
                    <button
                      onClick={() =>
                        handleCopyKey(newApiKey.privateKey || "", "Chave privada")
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">
                    ⚠️ Esta é a única vez que você verá esta chave privada completa.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleConfirmNewKeys}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: "#7C3AED" }}
            >
              Confirmar e fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ShadowPanel />
    </>
  );
}

export default function ApiKey() {
  return (
    <ProtectedRoute>
      <ApiKeyContent />
    </ProtectedRoute>
  );
}
