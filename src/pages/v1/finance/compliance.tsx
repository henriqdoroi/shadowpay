"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { AlertTriangle, Shield, FileX, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

interface Seller {
  id: string;
  companyName?: string;
  email: string;
  status_infringement: string;
  infringement?: Record<string, any>;
}

function ComplianceContent() {
  const transacoesEmAnalise = 0;
  const transacoesFraudulentas = 0;

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(
          "https://shadowpay-api-production.up.railway.app/api/payments/infringements",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success) return;
        setSellers(json.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const stats = [
    {
      label: "Transações em análise",
      value: transacoesEmAnalise,
      sub: "Aguardando revisão manual",
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "#F59E0B",
    },
    {
      label: "Transações fraudulentas",
      value: transacoesFraudulentas,
      sub: "Identificadas pelo sistema",
      icon: <Shield className="h-4 w-4" />,
      color: "#EF4444",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Compliance</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            Inteligência
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              letterSpacing: "-0.005em",
            }}
          >
            Compliance
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Monitoramento antifraude e petições da sua conta.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(15,23,42,0.06)",
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500">
                  {s.label}
                </p>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${s.color}14`, color: s.color }}
                >
                  {s.icon}
                </span>
              </div>
              <div
                className="mt-2 text-[28px] font-bold leading-none tracking-tight text-slate-900"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {s.value}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{s.sub}</p>
            </div>
          ))}
        </section>

        <div
          className="rounded-2xl"
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
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Petições de compliance
            </h2>
          </div>
          <div className="p-5">
            {sellers.length === 0 ? (
              <div className="mx-auto flex max-w-xl flex-col items-center justify-center space-y-4 py-14 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: "#F1F2F6",
                    border: "1px solid rgba(15,23,42,0.06)",
                  }}
                >
                  <FileX className="h-7 w-7 text-violet-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-slate-700">
                    Nenhuma petição encontrada
                  </h3>
                  <p className="text-sm text-slate-400">
                    Não há petições de compliance pendentes no momento.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {sellers.map((seller) => (
                  <div
                    key={seller.id}
                    className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-slate-50"
                    style={{
                      border: "1px solid rgba(15,23,42,0.06)",
                    }}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {seller.companyName || seller.email}
                      </p>
                      <p className="text-sm text-slate-500">
                        Status: {seller.status_infringement}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSeller(seller);
                        setIsModalOpen(true);
                      }}
                      className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalhes
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </LightShell>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da petição</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto rounded bg-slate-50 p-4 text-sm">
            <pre className="whitespace-pre-wrap break-all text-slate-700">
              {selectedSeller?.infringement
                ? JSON.stringify(selectedSeller.infringement, null, 2)
                : "Nenhum dado disponível"}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      <ShadowPanel />
    </>
  );
}

export default function Compliance() {
  return (
    <ProtectedRoute>
      <ComplianceContent />
    </ProtectedRoute>
  );
}
