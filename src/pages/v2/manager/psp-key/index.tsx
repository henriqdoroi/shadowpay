"use client";

import { useState } from "react";
import Head from "next/head";
import {
  Eye,
  EyeOff,
  Save,
  CreditCard,
  Key,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

interface PSPConfig {
  isActive: boolean;
  cashinFixedFee: string;
  cashinPercentageFee: string;
  cashoutFixedFee: string;
  cashoutPercentageFee: string;
  secretKey: string;
}

function PSPKeyContent() {
  const [config, setConfig] = useState<PSPConfig>({
    isActive: true,
    cashinFixedFee: "0.50",
    cashinPercentageFee: "2.99",
    cashoutFixedFee: "1.00",
    cashoutPercentageFee: "1.50",
    secretKey: "sk_test_4eC39HqLyjWDarjtT1zdp7dc",
  });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const change = (k: keyof PSPConfig, v: string | boolean) =>
    setConfig((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    alert("Configurações salvas com sucesso!");
  };

  const fmtCur = (v: string) => `R$ ${(parseFloat(v) || 0).toFixed(2)}`;
  const fmtPct = (v: string) => `${(parseFloat(v) || 0).toFixed(2)}%`;

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return (
    <>
      <Head>
        <title>ShadowPay — PSP Keys</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            Admin
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              letterSpacing: "-0.005em",
            }}
          >
            Configuração PSP
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Configure as integrações com provedores de pagamento.
          </p>
        </header>

        <div
          className="rounded-2xl p-6"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <h2
                  className="text-lg font-semibold text-slate-900"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Cashtime
                </h2>
                <p className="text-xs text-slate-500">
                  Provedor de serviços de pagamento
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  config.isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {config.isActive ? "Ativo" : "Inativo"}
              </span>
              <button
                onClick={() => change("isActive", !config.isActive)}
                role="switch"
                aria-checked={config.isActive}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.isActive ? "bg-violet-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    config.isActive ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <Key className="h-3.5 w-3.5" /> Secret key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={config.secretKey}
                onChange={(e) => change("secretKey", e.target.value)}
                className={inputCls + " pr-10 font-mono"}
                placeholder="Insira a secret key"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Cash In */}
          <div
            className="mt-6 space-y-4 pt-5"
            style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <ArrowDown className="h-3.5 w-3.5" /> Taxas de Cash In
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">
                  Taxa fixa
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.cashinFixedFee}
                    onChange={(e) => change("cashinFixedFee", e.target.value)}
                    className={inputCls + " pl-9"}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Valor: {fmtCur(config.cashinFixedFee)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">
                  Taxa percentual
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={config.cashinPercentageFee}
                    onChange={(e) =>
                      change("cashinPercentageFee", e.target.value)
                    }
                    className={inputCls + " pr-9"}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    %
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Percentual: {fmtPct(config.cashinPercentageFee)}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <strong>Exemplo R$ 100,00:</strong>{" "}
              {fmtCur(config.cashinFixedFee)} +{" "}
              {fmtPct(config.cashinPercentageFee)} ={" "}
              {fmtCur(
                (
                  parseFloat(config.cashinFixedFee) +
                  (100 * parseFloat(config.cashinPercentageFee)) / 100
                ).toString()
              )}
            </div>
          </div>

          {/* Cash Out */}
          <div
            className="mt-6 space-y-4 pt-5"
            style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
              <ArrowUp className="h-3.5 w-3.5" /> Taxas de Cash Out
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">
                  Taxa fixa
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.cashoutFixedFee}
                    onChange={(e) =>
                      change("cashoutFixedFee", e.target.value)
                    }
                    className={inputCls + " pl-9"}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Valor: {fmtCur(config.cashoutFixedFee)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">
                  Taxa percentual
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={config.cashoutPercentageFee}
                    onChange={(e) =>
                      change("cashoutPercentageFee", e.target.value)
                    }
                    className={inputCls + " pr-9"}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    %
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Percentual: {fmtPct(config.cashoutPercentageFee)}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <strong>Exemplo R$ 100,00:</strong>{" "}
              {fmtCur(config.cashoutFixedFee)} +{" "}
              {fmtPct(config.cashoutPercentageFee)} ={" "}
              {fmtCur(
                (
                  parseFloat(config.cashoutFixedFee) +
                  (100 * parseFloat(config.cashoutPercentageFee)) / 100
                ).toString()
              )}
            </div>
          </div>

          <div
            className="mt-6 flex justify-end pt-5"
            style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}
          >
            <button
              onClick={save}
              disabled={loading}
              className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-60"
              style={{
                background: "#7C3AED",
                boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
              }}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvando…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Salvar configurações
                </>
              )}
            </button>
          </div>
        </div>
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function PSPKeyPage() {
  return (
    <ProtectedRoute>
      <PSPKeyContent />
    </ProtectedRoute>
  );
}
