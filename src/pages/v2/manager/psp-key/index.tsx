import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Save,
  Settings,
  CreditCard,
  Key,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

interface PSPConfig {
  isActive: boolean;
  cashinFixedFee: string;
  cashinPercentageFee: string;
  cashoutFixedFee: string;
  cashoutPercentageFee: string;
  secretKey: string;
}

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

export default function PSPKeyPage() {
  const [config, setConfig] = useState<PSPConfig>({
    isActive: true,
    cashinFixedFee: "0.50",
    cashinPercentageFee: "2.99",
    cashoutFixedFee: "1.00",
    cashoutPercentageFee: "1.50",
    secretKey: "sk_test_4eC39HqLyjWDarjtT1zdp7dc",
  });

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfigChange = (
    field: keyof PSPConfig,
    value: string | boolean
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    alert("Configurações salvas com sucesso!");
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value || "0");
    return `R$ ${numValue.toFixed(2)}`;
  };

  const formatPercentage = (value: string) => {
    const numValue = parseFloat(value || "0");
    return `${numValue.toFixed(2)}%`;
  };

  const inputCls =
    "h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/[0.05] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return (
    <>
      <Head>
        <title>ShadowPay — PSP Keys</title>
      </Head>

      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
          <header className="flex items-center gap-3 px-4 pt-6 lg:px-8">
            <SidebarTrigger className="text-white/60 hover:text-white" />
            <div>
              <h1
                className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                Configuração PSP
              </h1>
              <p className="mt-1 text-xs text-white/40">
                Configure as integrações com provedores de serviços de pagamento
              </p>
            </div>
          </header>

          <main className="flex flex-col gap-5 p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-xl"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
                style={{ background: "rgba(139,92,246,0.2)" }}
              />

              {/* Header card */}
              <div className="relative mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-semibold text-white"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      Cashtime
                    </h2>
                    <p className="text-xs text-white/45">
                      Provedor de serviços de pagamento
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                      config.isActive
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : "border-white/15 bg-white/10 text-white/60"
                    }`}
                  >
                    {config.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleConfigChange("isActive", !config.isActive)
                    }
                    role="switch"
                    aria-checked={config.isActive}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.isActive ? "bg-violet-500" : "bg-white/15"
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

              {/* Secret Key */}
              <div className="relative space-y-2">
                <label className="flex items-center gap-1.5 text-xs text-white/55">
                  <Key className="h-3.5 w-3.5" /> Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? "text" : "password"}
                    value={config.secretKey}
                    onChange={(e) =>
                      handleConfigChange("secretKey", e.target.value)
                    }
                    className={`${inputCls} pr-10 font-mono`}
                    placeholder="Insira a secret key da Cashtime"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey((v) => !v)}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-white/55 hover:bg-white/[0.06] hover:text-white"
                  >
                    {showSecretKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Cash In */}
              <div className="relative mt-6 space-y-4 border-t border-white/[0.06] pt-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/85">
                  <ArrowDown className="h-3.5 w-3.5" /> Taxas de Cash In
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs text-white/55">
                      Taxa fixa
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={config.cashinFixedFee}
                        onChange={(e) =>
                          handleConfigChange("cashinFixedFee", e.target.value)
                        }
                        className={`${inputCls} pl-9`}
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-white/40">
                      Valor: {formatCurrency(config.cashinFixedFee)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs text-white/55">
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
                          handleConfigChange(
                            "cashinPercentageFee",
                            e.target.value
                          )
                        }
                        className={`${inputCls} pr-9`}
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-white/40">
                      Percentual: {formatPercentage(config.cashinPercentageFee)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-emerald-200/85">
                  <strong className="text-emerald-200">
                    Exemplo R$ 100,00:
                  </strong>{" "}
                  {formatCurrency(config.cashinFixedFee)} +{" "}
                  {formatPercentage(config.cashinPercentageFee)} ={" "}
                  {formatCurrency(
                    (
                      parseFloat(config.cashinFixedFee) +
                      (100 * parseFloat(config.cashinPercentageFee)) / 100
                    ).toString()
                  )}
                </div>
              </div>

              {/* Cash Out */}
              <div className="relative mt-6 space-y-4 border-t border-white/[0.06] pt-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-300/85">
                  <ArrowUp className="h-3.5 w-3.5" /> Taxas de Cash Out
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs text-white/55">
                      Taxa fixa
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={config.cashoutFixedFee}
                        onChange={(e) =>
                          handleConfigChange("cashoutFixedFee", e.target.value)
                        }
                        className={`${inputCls} pl-9`}
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-white/40">
                      Valor: {formatCurrency(config.cashoutFixedFee)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs text-white/55">
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
                          handleConfigChange(
                            "cashoutPercentageFee",
                            e.target.value
                          )
                        }
                        className={`${inputCls} pr-9`}
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-white/40">
                      Percentual:{" "}
                      {formatPercentage(config.cashoutPercentageFee)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-xs text-rose-200/85">
                  <strong className="text-rose-200">Exemplo R$ 100,00:</strong>{" "}
                  {formatCurrency(config.cashoutFixedFee)} +{" "}
                  {formatPercentage(config.cashoutPercentageFee)} ={" "}
                  {formatCurrency(
                    (
                      parseFloat(config.cashoutFixedFee) +
                      (100 * parseFloat(config.cashoutPercentageFee)) / 100
                    ).toString()
                  )}
                </div>
              </div>

              {/* Save */}
              <div className="relative mt-6 flex justify-end border-t border-white/[0.06] pt-5">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                    boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                  }}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Salvando…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar configurações
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <ShadowPanel />
    </>
  );
}
