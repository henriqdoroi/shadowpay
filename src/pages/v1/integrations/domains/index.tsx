"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
};

type Domain = {
  id: string;
  domain: string;
  status: "PENDING" | "VERIFIED" | "FAILED";
  verificationToken: string;
  verifiedAt?: string;
  lastCheckedAt?: string;
  createdAt: string;
};

function DomainsContent() {
  const { token } = useAuth();
  const [list, setList] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [domain, setDomain] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  async function fetchDomains() {
    if (!token) return;
    try {
      const r = await axios.get(`${API}/api/integrations/domains`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) setList(r.data.data || []);
    } catch (e) {
      console.error("domains fetch", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    setSaving(true);
    try {
      const r = await axios.post(
        `${API}/api/integrations/domains`,
        { domain: domain.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Domínio adicionado. Configure o DNS pra verificar.");
        setDomain("");
        setShowForm(false);
        await fetchDomains();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao adicionar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify(id: string) {
    setVerifyingId(id);
    try {
      const r = await axios.post(
        `${API}/api/integrations/domains/${id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        const status = r.data.data?.status;
        if (status === "VERIFIED") {
          toast.success("Domínio verificado!");
        } else {
          toast.error("DNS ainda não propagou. Tente em alguns minutos.");
        }
        setList((l) => l.map((d) => (d.id === id ? r.data.data : d)));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao verificar.");
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este domínio?")) return;
    try {
      await axios.delete(`${API}/api/integrations/domains/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Domínio removido.");
      setList((l) => l.filter((d) => d.id !== id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao remover.");
    }
  }

  function copyToken(t: string) {
    navigator.clipboard.writeText(t).then(() => toast.success("Token copiado!"));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            NEGÓCIOS · PRODUTOS
          </p>
          <h1
            className="text-[22px] font-bold tracking-tight sm:text-[28px] text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Domínios
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Hospede seus checkouts em seu próprio domínio (ex:
            pagamento.seusite.com.br).
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
          }}
        >
          <Plus className="h-4 w-4" />
          Novo domínio
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-2xl p-5"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${T.border}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(124,58,237,0.20)",
          }}
        >
          <h3 className="mb-3 text-[14px] font-bold text-slate-900">
            Adicionar domínio
          </h3>
          <div className="flex gap-2">
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="pagamento.seusite.com.br"
              className="h-10 flex-1 rounded-lg bg-slate-50 px-3 font-mono text-[13px] outline-none"
              style={{ border: `1px solid ${T.borderSoft}` }}
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-5 text-[13px] font-semibold text-white disabled:opacity-50"
              style={{
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                boxShadow: "0 6px 16px -8px rgba(124,58,237,0.45)",
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Após adicionar, você verá as instruções de DNS pra verificar a posse.
          </p>
        </form>
      )}

      {loading ? (
        <div
          className="rounded-2xl bg-white px-5 py-12 text-center text-[13px] text-slate-500"
          style={{ border: `1px solid ${T.borderSoft}` }}
        >
          Carregando…
        </div>
      ) : list.length === 0 ? (
        <div
          className="rounded-2xl bg-white px-5 py-12 text-center"
          style={{ border: `1px solid ${T.borderSoft}` }}
        >
          <Globe
            className="mx-auto mb-3 h-10 w-10"
            style={{ color: T.textMuted }}
          />
          <p className="text-[14px] font-semibold text-slate-700">
            Nenhum domínio conectado
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            Adicione seu primeiro domínio pra usar nos checkouts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl p-4 sm:p-5"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${T.borderSoft}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <p className="truncate font-mono text-[15px] font-bold text-slate-900">
                      {d.domain}
                    </p>
                    {d.status === "VERIFIED" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Verificado
                      </span>
                    ) : d.status === "FAILED" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                        <XCircle className="h-3 w-3" /> Falhou
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        Aguardando DNS
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Adicionado em{" "}
                    {new Date(d.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {d.status !== "VERIFIED" && (
                    <button
                      onClick={() => handleVerify(d.id)}
                      disabled={verifyingId === d.id}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold text-white disabled:opacity-50"
                      style={{
                        background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                      }}
                    >
                      {verifyingId === d.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Verificar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {d.status !== "VERIFIED" && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Configure este registro DNS:
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400">
                        TIPO
                      </p>
                      <p className="font-mono text-[12px] font-bold text-slate-800">
                        TXT
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400">
                        NOME
                      </p>
                      <p className="font-mono text-[12px] font-bold text-slate-800">
                        _shadowpay.{d.domain}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400">
                        VALOR
                      </p>
                      <div className="flex items-center gap-1">
                        <p className="truncate font-mono text-[12px] text-slate-700">
                          {d.verificationToken}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyToken(d.verificationToken)}
                          className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DomainsPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Domínios</title>
      </Head>
      <LightShell>
        <DomainsContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
