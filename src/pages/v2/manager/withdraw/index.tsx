import React, { useState } from "react";
import {
  Check,
  X,
  TrendingUp,
  Users,
  Clock,
  CreditCard,
  Mail,
  Phone,
  Hash,
  Building,
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

interface WithdrawRequest {
  id: string;
  merchantId: string;
  clientName: string;
  pixKey: string;
  pixKeyType: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "CHAVE_ALEATORIA";
  amount: number;
  netAmount: number;
  profit: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const mockWithdrawRequests: WithdrawRequest[] = [
  {
    id: "WD001",
    merchantId: "MERCH_001",
    clientName: "João Silva Santos",
    pixKey: "123.456.789-00",
    pixKeyType: "CPF",
    amount: 1500.0,
    netAmount: 1485.0,
    profit: 15.0,
    status: "PENDING",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "WD002",
    merchantId: "MERCH_002",
    clientName: "Maria Oliveira Costa",
    pixKey: "maria.oliveira@email.com",
    pixKeyType: "EMAIL",
    amount: 2300.5,
    netAmount: 2277.5,
    profit: 23.0,
    status: "PENDING",
    createdAt: "2024-01-15T09:15:00Z",
  },
  {
    id: "WD003",
    merchantId: "MERCH_003",
    clientName: "Carlos Eduardo Lima",
    pixKey: "+55 11 99999-8888",
    pixKeyType: "TELEFONE",
    amount: 850.75,
    netAmount: 842.25,
    profit: 8.5,
    status: "APPROVED",
    createdAt: "2024-01-15T08:45:00Z",
  },
  {
    id: "WD004",
    merchantId: "MERCH_001",
    clientName: "Ana Paula Ferreira",
    pixKey: "12.345.678/0001-90",
    pixKeyType: "CNPJ",
    amount: 5200.0,
    netAmount: 5148.0,
    profit: 52.0,
    status: "PENDING",
    createdAt: "2024-01-15T07:20:00Z",
  },
  {
    id: "WD005",
    merchantId: "MERCH_004",
    clientName: "Roberto Almeida",
    pixKey: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    pixKeyType: "CHAVE_ALEATORIA",
    amount: 750.25,
    netAmount: 742.75,
    profit: 7.5,
    status: "REJECTED",
    createdAt: "2024-01-14T16:30:00Z",
  },
  {
    id: "WD006",
    merchantId: "MERCH_002",
    clientName: "Fernanda Santos",
    pixKey: "fernanda.santos@empresa.com.br",
    pixKeyType: "EMAIL",
    amount: 3100.0,
    netAmount: 3069.0,
    profit: 31.0,
    status: "PENDING",
    createdAt: "2024-01-14T14:15:00Z",
  },
];

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

export default function WithdrawPage() {
  const [withdrawRequests, setWithdrawRequests] =
    useState<WithdrawRequest[]>(mockWithdrawRequests);
  const [loadingActions, setLoadingActions] = useState<{
    [key: string]: boolean;
  }>({});

  const handleApprove = async (withdrawId: string) => {
    setLoadingActions((prev) => ({ ...prev, [withdrawId]: true }));
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setWithdrawRequests((prev) =>
      prev.map((request) =>
        request.id === withdrawId
          ? { ...request, status: "APPROVED" as const }
          : request
      )
    );
    setLoadingActions((prev) => ({ ...prev, [withdrawId]: false }));
  };

  const handleReject = async (withdrawId: string) => {
    setLoadingActions((prev) => ({ ...prev, [withdrawId]: true }));
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setWithdrawRequests((prev) =>
      prev.map((request) =>
        request.id === withdrawId
          ? { ...request, status: "REJECTED" as const }
          : request
      )
    );
    setLoadingActions((prev) => ({ ...prev, [withdrawId]: false }));
  };

  const getPixKeyIcon = (type: string) => {
    switch (type) {
      case "CPF":
      case "CNPJ":
        return <Hash className="h-3.5 w-3.5" />;
      case "EMAIL":
        return <Mail className="h-3.5 w-3.5" />;
      case "TELEFONE":
        return <Phone className="h-3.5 w-3.5" />;
      case "CHAVE_ALEATORIA":
        return <CreditCard className="h-3.5 w-3.5" />;
      default:
        return <Hash className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      PENDING: {
        color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        text: "Pendente",
      },
      APPROVED: {
        color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        text: "Aprovado",
      },
      REJECTED: {
        color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        text: "Rejeitado",
      },
    };
    const cfg = map[status] ?? {
      color: "bg-white/10 text-white/60 border-white/15",
      text: status,
    };
    return (
      <span
        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cfg.color}`}
      >
        {cfg.text}
      </span>
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));

  const pendingRequests = withdrawRequests.filter(
    (req) => req.status === "PENDING"
  );
  const totalPendingAmount = pendingRequests.reduce(
    (sum, req) => sum + req.amount,
    0
  );
  const totalProfit = withdrawRequests.reduce(
    (sum, req) => sum + req.profit,
    0
  );
  const approvedToday = withdrawRequests.filter((req) => {
    const today = new Date().toDateString();
    const reqDate = new Date(req.createdAt).toDateString();
    return req.status === "APPROVED" && today === reqDate;
  }).length;

  const kpis = [
    {
      label: "Saques pendentes",
      value: String(pendingRequests.length),
      sub: `${formatCurrency(totalPendingAmount)} em análise`,
      icon: <Clock className="h-4 w-4" />,
      accent: "#F59E0B",
    },
    {
      label: "Aprovados hoje",
      value: String(approvedToday),
      sub: "Saques processados",
      icon: <Check className="h-4 w-4" />,
      accent: "#34D399",
    },
    {
      label: "Lucro total",
      value: formatCurrency(totalProfit),
      sub: "Em taxas de saque",
      icon: <TrendingUp className="h-4 w-4" />,
      accent: "#22D3EE",
    },
    {
      label: "Total solicitações",
      value: String(withdrawRequests.length),
      sub: "Todas as solicitações",
      icon: <Users className="h-4 w-4" />,
      accent: "#8B5CF6",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Saques (Admin)</title>
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
                Gerenciamento de Saques
              </h1>
              <p className="mt-1 text-xs text-white/40">
                Aprove e rejeite solicitações de saque dos usuários
              </p>
            </div>
          </header>

          <main className="flex flex-col gap-5 p-4 lg:p-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((k, i) => (
                <motion.div
                  key={k.label}
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
                    style={{ background: `${k.accent}22` }}
                  />
                  <div className="relative mb-4 flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: `${k.accent}1f`, color: k.accent }}
                    >
                      {k.icon}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                      {k.label}
                    </span>
                  </div>
                  <div
                    className="relative text-2xl font-semibold tracking-tight text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    {k.value}
                  </div>
                  <p className="relative mt-1.5 text-xs text-white/35">
                    {k.sub}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Tabela */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
            >
              <div className="border-b border-white/[0.06] px-5 py-4">
                <h2
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Solicitações de saque
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  Lista de todas as solicitações de saque dos usuários
                </p>
              </div>

              <div className="overflow-x-auto p-2 sm:p-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-white/40">
                      <th className="px-3 py-2 font-medium">ID</th>
                      <th className="px-3 py-2 font-medium">Merchant</th>
                      <th className="px-3 py-2 font-medium">Cliente</th>
                      <th className="px-3 py-2 font-medium">Chave PIX</th>
                      <th className="px-3 py-2 font-medium">Tipo</th>
                      <th className="px-3 py-2 font-medium">Bruto</th>
                      <th className="px-3 py-2 font-medium">Líquido</th>
                      <th className="px-3 py-2 font-medium">Lucro</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Data</th>
                      <th className="px-3 py-2 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-3 py-3 font-mono text-xs text-white/80">
                          {request.id}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 text-xs text-white/70">
                            <Building className="h-3.5 w-3.5 text-white/40" />
                            {request.merchantId}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-medium text-white/90">
                          {request.clientName}
                        </td>
                        <td className="px-3 py-3">
                          <div
                            className="max-w-[180px] truncate text-xs text-white/70"
                            title={request.pixKey}
                          >
                            {request.pixKey}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-white/65">
                            {getPixKeyIcon(request.pixKeyType)}
                            {request.pixKeyType}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-medium text-white/85">
                          {formatCurrency(request.amount)}
                        </td>
                        <td className="px-3 py-3 font-medium text-sky-300">
                          {formatCurrency(request.netAmount)}
                        </td>
                        <td className="px-3 py-3 font-medium text-emerald-400">
                          {formatCurrency(request.profit)}
                        </td>
                        <td className="px-3 py-3">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-3 py-3 text-xs text-white/50">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {request.status === "PENDING" ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleApprove(request.id)}
                                disabled={loadingActions[request.id]}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                {loadingActions[request.id] ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                disabled={loadingActions[request.id]}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                              >
                                {loadingActions[request.id] ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <X className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-white/35">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <ShadowPanel />
    </>
  );
}
