"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AlertTriangle, Shield, FileX, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

// Tipagem para o seller com possíveis dados de infração
interface Seller {
  id: string;
  companyName?: string;
  email: string;
  status_infringement: string;
  infringement?: Record<string, any>;
}

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

export default function Compliance() {
  const transacoesEmAnalise = 0;
  const transacoesFraudulentas = 0;

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("Token JWT não encontrado no localStorage");
          return;
        }

        const response = await fetch(
          "https://shadowpay-api-production.up.railway.app/api/payments/infringements",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro na API:", response.status, errorText);
          return;
        }

        const json = await response.json();

        if (!json.success) {
          console.error("Erro na resposta da API:", json.message);
          return;
        }

        setSellers(json.data || []);
      } catch (err) {
        console.error("Erro ao buscar sellers:", err);
      }
    };

    fetchSellers();
  }, []);

  const handleViewDetails = (seller: Seller) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
  };

  const stats = [
    {
      title: "Transações em Análise",
      value: transacoesEmAnalise,
      sub: "Aguardando revisão manual",
      icon: <AlertTriangle className="h-4 w-4" />,
      accent: "#F59E0B",
    },
    {
      title: "Transações Fraudulentas",
      value: transacoesFraudulentas,
      sub: "Identificadas pelo sistema",
      icon: <Shield className="h-4 w-4" />,
      accent: "#F43F5E",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Compliance</title>
      </Head>

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            {/* Header */}
            <header className="flex items-center gap-3 px-4 pt-6 lg:px-8">
              <SidebarTrigger className="text-white/60 hover:text-white" />
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Compliance
                </h1>
                <p className="mt-1 text-xs text-white/40">
                  Monitoramento antifraude e petições da sua conta
                </p>
              </div>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {/* Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                  >
                    <div
                      className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                      style={{ background: `${s.accent}22` }}
                    />
                    <div className="relative mb-4 flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${s.accent}1f`, color: s.accent }}
                      >
                        {s.icon}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                        {s.title}
                      </span>
                    </div>
                    <div
                      className="relative text-3xl font-semibold tracking-tight text-white"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {s.value}
                    </div>
                    <p className="relative mt-1.5 text-xs text-white/35">
                      {s.sub}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Petições */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="border-b border-white/[0.06] px-5 py-4">
                  <h2
                    className="text-sm font-semibold text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Petições de Compliance
                  </h2>
                </div>
                <div className="p-5">
                  {sellers.length === 0 ? (
                    <div className="mx-auto flex max-w-xl flex-col items-center justify-center space-y-4 py-14 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
                        <FileX className="h-7 w-7 text-violet-300/60" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-medium text-white/80">
                          Nenhuma petição encontrada
                        </h3>
                        <p className="text-sm text-white/40">
                          Não há petições de compliance pendentes no momento.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sellers.map((seller) => (
                        <div
                          key={seller.id}
                          className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                        >
                          <div>
                            <p className="font-semibold text-white/90">
                              {seller.companyName || seller.email}
                            </p>
                            <p className="text-sm text-white/40">
                              Status: {seller.status_infringement}
                            </p>
                          </div>
                          <button
                            onClick={() => handleViewDetails(seller)}
                            className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                            Ver Detalhes
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </main>
          </SidebarInset>
        </SidebarProvider>

        {/* Modal de Detalhes */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Petição</DialogTitle>
            </DialogHeader>
            <div className="max-h-[400px] overflow-auto rounded bg-white/[0.03] p-4 text-sm">
              <pre className="whitespace-pre-wrap break-all text-white/70">
                {selectedSeller?.infringement
                  ? JSON.stringify(selectedSeller.infringement, null, 2)
                  : "Nenhum dado disponível"}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
        <ShadowPanel />
      </div>
    </>
  );
}
