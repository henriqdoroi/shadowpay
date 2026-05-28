"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "axios";
import { Building2, CheckCircle2, XCircle, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
};

type Acquirer = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  status?: "ACTIVE" | "INACTIVE" | string;
  isActive?: boolean;
  fee?: number;
  feePercent?: number;
  withdrawalFee?: number;
  createdAt?: string;
};

function AcquirersContent() {
  const { token } = useAuth();
  const [list, setList] = useState<Acquirer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await axios.get(`${API}/api/adquerers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = r.data?.data || r.data?.acquirers || r.data || [];
        setList(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error("acquirers fetch", e);
        setError(
          e?.response?.data?.message ||
            "Não foi possível carregar adquirentes."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const active = list.filter((a) => a.isActive || a.status === "ACTIVE");

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            AVANÇADO
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Adquirentes
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Adquirentes PIX disponíveis na sua conta — roteamento e taxas.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 text-[12px] font-semibold"
          style={{
            background: T.primaryBg,
            color: T.primary,
            border: `1px solid ${T.border}`,
          }}
        >
          <Activity className="h-3.5 w-3.5" />
          {active.length} ativas · {list.length} total
        </div>
      </header>

      {error && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-[13px]"
          style={{
            background: "rgba(239, 68, 68, 0.06)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "#B91C1C",
          }}
        >
          {error}
        </div>
      )}

      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.borderSoft}`,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        {loading ? (
          <div className="px-5 py-12 text-center text-[13px] text-slate-500">
            Carregando…
          </div>
        ) : list.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Building2
              className="mx-auto mb-3 h-10 w-10"
              style={{ color: T.textMuted }}
            />
            <p className="text-[14px] font-semibold text-slate-700">
              Nenhuma adquirente vinculada
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              Entre em contato com o suporte pra solicitar uma adquirente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-left text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: T.textMuted, background: "#F8FAFC" }}
                >
                  <th className="px-5 py-2.5">Adquirente</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Taxa PIX</th>
                  <th className="px-5 py-2.5 text-right">Taxa de saque</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const isActive = a.isActive || a.status === "ACTIVE";
                  return (
                    <tr
                      key={a.id}
                      style={{ borderTop: `1px solid ${T.borderSoft}` }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-bold text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
                            }}
                          >
                            {(a.name?.[0] || "A").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {a.name}
                            </p>
                            {a.description && (
                              <p className="text-[11px] text-slate-500">
                                {a.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            <XCircle className="h-3 w-3" />
                            Inativa
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">
                        {a.feePercent != null
                          ? `${Number(a.feePercent).toFixed(2)}%`
                          : a.fee != null
                          ? `${Number(a.fee).toFixed(2)}%`
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">
                        {a.withdrawalFee != null
                          ? Number(a.withdrawalFee).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcquirersPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Adquirentes</title>
      </Head>
      <LightShell>
        <AcquirersContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
